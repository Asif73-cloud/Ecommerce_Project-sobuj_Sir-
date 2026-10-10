 using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("categories")]
    public class Category
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("Slug")]
        public string Slug { get; set; } = string.Empty;

        [Column("ParentId")]
        public int? ParentId { get; set; }

        [MaxLength(100)]
        [Column("Icon")]
        public string? Icon { get; set; }

        [Column("SortOrder")]
        public int SortOrder { get; set; } = 0;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}