using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KenovaBackend.Data;

namespace KenovaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CouponsController(AppDbContext context)
        {
            _context = context;
        }

        /* POST: /api/coupons/validate  (auth)
           Body: { code, subtotal }
        */
        [HttpPost("validate")]
        [Authorize]
        public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.Code))
                    return BadRequest(new { success = false, message = "Coupon code is required" });

                var coupon = await _context.Coupons
                    .FirstOrDefaultAsync(c => c.Code == dto.Code && c.IsActive);

                if (coupon == null)
                    return BadRequest(new { success = false, message = "Invalid or expired coupon" });

                if (dto.Subtotal < coupon.MinOrderAmount)
                    return BadRequest(new
                    {
                        success = false,
                        message = $"Minimum order amount is {coupon.MinOrderAmount}"
                    });

                decimal discount = 0;

                if (coupon.Type.ToLower() == "percentage")
                {
                    discount = Math.Round(dto.Subtotal * (coupon.Value / 100m), 2);
                }
                else // fixed
                {
                    discount = coupon.Value;
                }

                // Don't exceed subtotal
                if (discount > dto.Subtotal) discount = dto.Subtotal;

                return Ok(new
                {
                    success = true,
                    code = coupon.Code,
                    type = coupon.Type,
                    value = coupon.Value,
                    discount,
                    message = "Coupon applied"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* GET: /api/coupons  (admin) */
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetCoupons()
        {
            try
            {
                var coupons = await _context.Coupons
                    .OrderByDescending(c => c.Id)
                    .Select(c => new
                    {
                        c.Id,
                        c.Code,
                        c.Type,
                        c.Value,
                        c.MinOrderAmount,
                        c.IsActive,
                        c.CreatedAt
                    })
                    .ToListAsync();

                return Ok(coupons);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* POST: /api/coupons  (admin) */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateCoupon([FromBody] CreateCouponDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Code))
                    return BadRequest(new { success = false, message = "Code is required" });

                var exists = await _context.Coupons.AnyAsync(c => c.Code == dto.Code);
                if (exists)
                    return BadRequest(new { success = false, message = "Coupon code already exists" });

                var coupon = new Models.Coupon
                {
                    Code = dto.Code.ToUpper(),
                    Type = dto.Type ?? "percentage",
                    Value = dto.Value,
                    MinOrderAmount = dto.MinOrderAmount,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Coupons.Add(coupon);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Coupon created",
                    couponId = coupon.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* DELETE: /api/coupons/{id}  (admin) */
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            try
            {
                var coupon = await _context.Coupons.FindAsync(id);
                if (coupon == null)
                    return NotFound(new { success = false, message = "Coupon not found" });

                _context.Coupons.Remove(coupon);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Coupon deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class ValidateCouponDto
    {
        public string Code { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
    }

    public class CreateCouponDto
    {
        public string Code { get; set; } = string.Empty;
        public string? Type { get; set; } = "percentage";
        public decimal Value { get; set; }
        public decimal MinOrderAmount { get; set; } = 0;
    }
}