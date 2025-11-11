import { useEffect, useState } from "react";

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolokacija nije podržana u vašem pregledniku.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // 🔹 pozivamo backend koji već ima API key
        const res = await fetch(`/api/weather/location?lat=${latitude}&lon=${longitude}`);
        if (!res.ok) throw new Error("Ne mogu dohvatiti vrijeme.");

        const data = await res.json();
        setWeather({
          grad: data.grad,
          temperatura: data.temperatura,
          opis: data.opis,
          ikona: data.ikona
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }, (err) => {
      setError("Nije dopuštena lokacija.");
      console.error(err);
    });
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!weather) return <div>Učitavanje vremena...</div>;

  return (
    <div style={{
      position: "fixed",
      top: 10,
      right: 10,
      background: "rgba(255,255,255,0.9)",
      padding: 15,
      borderRadius: 10,
      boxShadow: "0 0 10px rgba(0,0,0,0.3)",
      textAlign: "center",
      zIndex: 1000
    }}>
      <h4>{weather.grad}</h4>
      <p>{weather.opis}</p>
      <h3>{weather.temperatura} °C</h3>
      <img
        src={`https://openweathermap.org/img/wn/${weather.ikona}@2x.png`}
        alt="ikona"
        style={{ width: 50, height: 50 }}
      />
    </div>
  );
}

export default WeatherWidget;
