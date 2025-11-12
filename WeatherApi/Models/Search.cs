using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WeatherApi.Models
{
    public class Search
    {
        [Key]
        public int Id { get; set; }

        // FK na korisnika
        public int? UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [Required]
        public string City { get; set; } = "";

        // Vrijeme kada je korisnik napravio pretragu
        public DateTime QueryTime { get; set; } = DateTime.UtcNow;

        // Sažetak prvog vremenskog zapisa (ili null)
        public decimal? Temp { get; set; }
        public string Description { get; set; } = "";
        public string Icon { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
