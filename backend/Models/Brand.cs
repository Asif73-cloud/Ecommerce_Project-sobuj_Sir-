using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("brands")]
    public class Brand
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Column("Name")]
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [Column("Slug")]
        [Required]
        [MaxLength(140)]
        public string Slug { get; set; } = string.Empty;

        [Column("Logo")]
        public string? Logo { get; set; }

        [Column("Description")]
        public string? Description { get; set; }

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}