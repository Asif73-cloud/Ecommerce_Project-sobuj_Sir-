using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using KenovaBackend.Data;

namespace KenovaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
        }

        /* POST: /api/payments  (auth) */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.Id == dto.OrderId && o.UserId == userId);

                if (order == null)
                    return NotFound(new { success = false, message = "Order not found" });

                var payment = new Models.Payment
                {
                    OrderId = dto.OrderId,
                    Amount = dto.Amount > 0 ? dto.Amount : order.Total,
                    Method = dto.Method ?? "cod",
                    Status = dto.Method == "cod" ? "pending" : "success",
                    TransactionId = dto.TransactionId,
                    PaidAt = dto.Method == "cod" ? null : DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);

                // Update order payment status
                if (payment.Status == "success")
                {
                    order.Status = "confirmed";
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Payment recorded",
                    paymentId = payment.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* GET: /api/payments/{orderId}  (auth) */
        [HttpGet("{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetPaymentByOrder(int orderId)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

                if (order == null)
                    return NotFound(new { success = false, message = "Order not found" });

                var payments = await _context.Payments
                    .Where(p => p.OrderId == orderId)
                    .OrderByDescending(p => p.Id)
                    .Select(p => new
                    {
                        p.Id,
                        p.OrderId,
                        p.Amount,
                        p.Method,
                        p.Status,
                        p.TransactionId,
                        p.PaidAt,
                        p.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new { success = true, payments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* PATCH: /api/payments/{id}/status  (admin) */
        [HttpPatch("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePaymentStatusDto dto)
        {
            try
            {
                var payment = await _context.Payments.FindAsync(id);
                if (payment == null)
                    return NotFound(new { success = false, message = "Payment not found" });

                payment.Status = dto.Status ?? payment.Status;
                if (payment.Status == "success") payment.PaidAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Payment status updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }
    }

    public class CreatePaymentDto
    {
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string? Method { get; set; }
        public string? TransactionId { get; set; }
    }

    public class UpdatePaymentStatusDto
    {
        public string? Status { get; set; }
    }
}