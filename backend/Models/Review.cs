 using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("reviews")]
    public class Review
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("ProductId")]
        public int ProductId { get; set; }

        [Required]
        [Column("UserId")]
        public int UserId { get; set; }

        [Required]
        [Range(1, 5)]
        [Column("Rating")]
        public int Rating { get; set; } = 5;

        [Column("Comment")]
        public string? Comment { get; set; }

        [Column("IsApproved")]
        public bool IsApproved { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ============================================
        // Navigation Properties
        // ============================================
        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}