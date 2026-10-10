using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("OrderId")]
        public int OrderId { get; set; }

        [Required]
        [Column("Amount")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(30)]
        [Column("Method")]
        public string Method { get; set; } = "cod";
        // cod, card, mobile, bank

        [Required]
        [MaxLength(30)]
        [Column("Status")]
        public string Status { get; set; } = "pending";
        // pending, success, failed, refunded

        [MaxLength(100)]
        [Column("TransactionId")]
        public string? TransactionId { get; set; }

        [Column("PaidAt")]
        public DateTime? PaidAt { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // ============================================
        // Navigation
        // ============================================
        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }
    }
}