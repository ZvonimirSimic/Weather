using System.Net.Http;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WeatherApi.Data;
using WeatherApi.Models;
using Microsoft.AspNetCore.Authorization;
using WeatherApi.Models;
using WeatherApi.Data;

var builder = WebApplication.CreateBuilder(args);

// ==========================
// 🔹 1. PostgreSQL baza
// ==========================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ==========================
// 🔹 2. CORS za React
// ==========================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.WithOrigins("http://localhost:3000")
                        .AllowAnyHeader()
                        .AllowAnyMethod());
});

// ==========================
// 🔹 3. PasswordHasher i JWT
// ==========================
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

var jwtConfig = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtConfig["Key"] ?? "DEFAULT_SECRET_KEY_SHOULD_BE_LONG_AND_SECURE");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtConfig["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtConfig["Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder.Build();

// ==========================
// 🔹 4. Middleware
// ==========================
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ==========================
// 🔹 5. Forecast 5 dana po gradu + spremanje pretrage
// ==========================
app.MapGet("/api/forecast/{city}", async (
    string city,
    HttpContext http,
    AppDbContext db
) =>
{
    var apiKey = builder.Configuration["APIKey"];
    var client = new HttpClient();
    var url = $"https://api.openweathermap.org/data/2.5/forecast?q={city}&units=metric&appid={apiKey}&lang=hr";

    var response = await client.GetAsync(url);
    if (!response.IsSuccessStatusCode)
        return Results.NotFound("Grad nije pronađen");

    var json = await response.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);
    var list = doc.RootElement.GetProperty("list");

    var now = DateTime.UtcNow;
    var result = list.EnumerateArray()
        .Select(item => new
        {
            date = item.GetProperty("dt_txt").GetString(),
            temp = item.GetProperty("main").GetProperty("temp").GetDecimal(),
            description = item.GetProperty("weather")[0].GetProperty("description").GetString(),
            icon = item.GetProperty("weather")[0].GetProperty("icon").GetString()
        })
        .Where(f => DateTime.Parse(f.date) >= now)
        .ToList();

    // 🔹 Ako je korisnik prijavljen, pohrani pretragu
    int? userId = null;
    if (http.User.Identity?.IsAuthenticated == true)
    {
        var uidClaim = http.User.Claims.FirstOrDefault(c => c.Type == "uid");
        if (uidClaim != null && int.TryParse(uidClaim.Value, out var parsed))
            userId = parsed;
    }

    var first = result.FirstOrDefault();
    var normalizedCity = city.Trim().ToLower(); // sve u mala slova

    var search = new Search
    {
        UserId = userId,
        City = normalizedCity,  // 🔹 spremamo u mala slova
        Temp = first?.temp,
        Description = first?.description ?? "",
        Icon = first?.icon ?? "",
        RawJson = json
    };

    db.Searches.Add(search);
    await db.SaveChangesAsync();

    return Results.Ok(result);
});

// ==========================
// 🔹 6. Povijest pretraga (autorizirano)
// ==========================
app.MapGet("/api/searches/me", [Authorize] async (HttpContext http, AppDbContext db) =>
{
    var uidClaim = http.User.Claims.FirstOrDefault(c => c.Type == "uid");
    if (uidClaim == null) return Results.Unauthorized();

    int userId = int.Parse(uidClaim.Value);
    var searches = await db.Searches
        .Where(s => s.UserId == userId)
        .OrderByDescending(s => s.QueryTime)
        .Take(100)
        .ToListAsync();

    return Results.Ok(searches);
});

// ==========================
// 🔹 7. Statistika pretraga
// ==========================

// ✅ Top 3 najčešće pretraživani gradovi
app.MapGet("/api/stats/top-cities", [Authorize] async (HttpContext http, AppDbContext db) =>
{
    var uidClaim = http.User.Claims.FirstOrDefault(c => c.Type == "uid");
    if (uidClaim == null) return Results.Unauthorized();
    int userId = int.Parse(uidClaim.Value);

    var data = await db.Searches
        .Where(s => s.UserId == userId)
        .GroupBy(s => s.City)
        .Select(g => new { City = g.Key, Count = g.Count() })
        .OrderByDescending(g => g.Count)
        .Take(3)
        .ToListAsync();

    return Results.Ok(data);
});

// ✅ Posljednje 3 pretrage
app.MapGet("/api/stats/recent", [Authorize] async (HttpContext http, AppDbContext db) =>
{
    var uidClaim = http.User.Claims.FirstOrDefault(c => c.Type == "uid");
    if (uidClaim == null) return Results.Unauthorized();
    int userId = int.Parse(uidClaim.Value);

    var recent = await db.Searches
        .Where(s => s.UserId == userId)
        .OrderByDescending(s => s.QueryTime)
        .Take(3)
        .Select(s => new
        {
            s.City,
            s.Temp,
            s.Description,
            s.Icon,
            s.QueryTime
        })
        .ToListAsync();

    return Results.Ok(recent);
});

// ✅ Distribucija vremenskih uvjeta
app.MapGet("/api/stats/conditions", [Authorize] async (HttpContext http, AppDbContext db) =>
{
    var uidClaim = http.User.Claims.FirstOrDefault(c => c.Type == "uid");
    if (uidClaim == null) return Results.Unauthorized();
    int userId = int.Parse(uidClaim.Value);

    var distribution = await db.Searches
        .Where(s => s.UserId == userId)
        .GroupBy(s => s.Description)
        .Select(g => new { Condition = g.Key, Count = g.Count() })
        .OrderByDescending(g => g.Count)
        .ToListAsync();

    return Results.Ok(distribution);
});

// ==========================
// 🔹 8. Widget po lokaciji
// ==========================
app.MapGet("/api/weather/location", async (double lat, double lon) =>
{
    var apiKey = builder.Configuration["APIKey"];
    var client = new HttpClient();
    var url = $"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={apiKey}&lang=hr";

    var response = await client.GetAsync(url);
    if (!response.IsSuccessStatusCode)
        return Results.NotFound("Lokacija nije pronađena.");

    var json = await response.Content.ReadAsStringAsync();
    using var doc = JsonDocument.Parse(json);
    var root = doc.RootElement;

    var result = new
    {
        grad = root.GetProperty("name").GetString(),
        temperatura = root.GetProperty("main").GetProperty("temp").GetDecimal(),
        opis = root.GetProperty("weather")[0].GetProperty("description").GetString(),
        ikona = root.GetProperty("weather")[0].GetProperty("icon").GetString()
    };

    return Results.Ok(result);
});

// ==========================
// 🔹 9. Zaštićeni endpoint (JWT)
// ==========================
app.MapGet("/api/protected", [Microsoft.AspNetCore.Authorization.Authorize] (ClaimsPrincipal user) =>
{
    var username = user.Identity?.Name ?? user.FindFirst("sub")?.Value;
    return Results.Ok(new { msg = $"Pozdrav {username}" });
});

// ==========================
// 🔹 10. Pokreni aplikaciju
// ==========================
app.Run();