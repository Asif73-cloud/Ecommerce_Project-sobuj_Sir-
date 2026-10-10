 using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("products")]
    public class Product
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        [Column("Name")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("Brand")]
        public string? Brand { get; set; }

        [Column("Description")]
        public string? Description { get; set; }

        [Required]
        [Column("Price")]
        public decimal Price { get; set; }

        [Column("OldPrice")]
        public decimal? OldPrice { get; set; }

        [Column("Discount")]
        public int Discount { get; set; } = 0;

        [Column("Rating")]
        public int Rating { get; set; } = 0;

        [Column("Reviews")]
        public int Reviews { get; set; } = 0;

        [Column("Image")]
        public string? Image { get; set; }

        [Column("Category")]
        public string? Category { get; set; }

        [MaxLength(200)]
        [Column("Slug")]
        public string? Slug { get; set; }

        [MaxLength(50)]
        [Column("SKU")]
        public string? SKU { get; set; }

        [Column("BrandId")]
        public int? BrandId { get; set; }

        [Column("CategoryId")]
        public int? CategoryId { get; set; }

        [Column("Stock")]
        public int Stock { get; set; } = 0;

        [Column("Sold")]
        public int Sold { get; set; } = 0;

        [Column("Views")]
        public int Views { get; set; } = 0;

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("IsFeatured")]
        public bool IsFeatured { get; set; } = false;

        // ============================================
        // Audit fields (NOT in DB — but EF needs them for in-memory use)
        // ============================================
        [NotMapped]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [NotMapped]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // ============================================
        // Navigation Properties
        // ============================================
        [ForeignKey("BrandId")]
        public virtual Brand? BrandNav { get; set; }

        [ForeignKey("CategoryId")]
        public virtual Category? CategoryNav { get; set; }
    }
}