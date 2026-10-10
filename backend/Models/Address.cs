 using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("addresses")]
    public class Address
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Column("UserId")]
        public int UserId { get; set; }

        [MaxLength(50)]
        [Column("Label")]
        public string? Label { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("FullName")]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("Phone")]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [Column("Street")]
        public string Street { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("City")]
        public string City { get; set; } = string.Empty;

        [MaxLength(20)]
        [Column("PostCode")]
        public string? PostCode { get; set; }

        [MaxLength(100)]
        [Column("Country")]
        public string Country { get; set; } = "Bangladesh";

        [Column("IsDefault")]
        public bool IsDefault { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}