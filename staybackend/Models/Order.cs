 using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("orders")]
    public class Order
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [Column("OrderNumber")]
        public string OrderNumber { get; set; } = string.Empty;

        [Required]
        [Column("UserId")]
        public int UserId { get; set; }

        [Required]
        [Column("Total")]
        public decimal Total { get; set; }

        [Column("Shipping")]
        public decimal Shipping { get; set; } = 0;

        [Column("Discount")]
        public decimal Discount { get; set; } = 0;

        [Required]
        [Column("Status")]
        public string Status { get; set; } = "pending";
        // pending, confirmed, processing, shipped, delivered, cancelled

        [Column("PaymentMethod")]
        public string? PaymentMethod { get; set; }

        [Column("ShippingAddress")]
        public string? ShippingAddress { get; set; }

        [Column("City")]
        public string? City { get; set; }

        [Column("PostCode")]
        public string? PostCode { get; set; }

        [Column("Phone")]
        public string? Phone { get; set; }

        [Column("Email")]
        public string? Email { get; set; }

        [Column("DeliveryNote")]
        public string? DeliveryNote { get; set; }

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("EstimatedDelivery")]
        public DateTime? EstimatedDelivery { get; set; }

        // ============================================
        // Navigation Properties
        // ============================================
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}