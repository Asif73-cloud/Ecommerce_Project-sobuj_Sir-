 using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("coupons")]
    public class Coupon
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("Code")]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("Type")]
        public string Type { get; set; } = "percentage";

        [Column("Value")]
        public decimal Value { get; set; }

        [Column("MinOrderAmount")]
        public decimal MinOrderAmount { get; set; } = 0;

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}