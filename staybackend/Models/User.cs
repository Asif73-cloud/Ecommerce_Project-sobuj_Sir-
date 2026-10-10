 using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace KenovaBackend.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("Id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("FirstName")]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [Column("LastName")]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [Column("Email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        [Column("Phone")]
        public string Phone { get; set; } = string.Empty;

        [Required]
        [Column("PasswordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        [Column("Bio")]
        public string? Bio { get; set; }

        [Column("DateOfBirth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("Gender")]
        public string? Gender { get; set; }

        [Column("Avatar")]
        public string? Avatar { get; set; }

        [Column("Address")]
        public string? Address { get; set; }

        [Column("City")]
        public string? City { get; set; }

        [Column("PostCode")]
        public string? PostCode { get; set; }

        [Column("Points")]
        public int Points { get; set; } = 0;

        [Column("TwoFactorEnabled")]
        public bool TwoFactorEnabled { get; set; } = false;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(20)]
        [Column("Role")]
        public string Role { get; set; } = "customer";

        [Column("IsActive")]
        public bool IsActive { get; set; } = true;

        [Column("EmailVerified")]
        public bool EmailVerified { get; set; } = false;

        [Column("LastLoginAt")]
        public DateTime? LastLoginAt { get; set; }

        // ============================================
        // Navigation Properties
        // ============================================
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}