using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("orderitems")]
    public class OrderItem
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("OrderId")]
        public int OrderId { get; set; }

        [Required]
        [Column("ProductId")]
        public int ProductId { get; set; }

        [Required]
        [Column("ProductName")]
        public string ProductName { get; set; } = string.Empty;

        [Required]
        [Column("Price")]
        public decimal Price { get; set; }

        [Required]
        [Column("Quantity")]
        public int Quantity { get; set; }

        [Column("Image")]
        public string? Image { get; set; }

        // ============================================
        // Navigation Properties
        // ============================================
        [ForeignKey("OrderId")]
        public virtual Order? Order { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product? Product { get; set; }
    }
}