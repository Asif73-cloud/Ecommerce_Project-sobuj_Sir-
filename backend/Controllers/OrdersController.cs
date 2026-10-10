 using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using KenovaBackend.Data;
using KenovaBackend.Models;

namespace KenovaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        /* POST: /api/orders  (auth) — place order with items */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                if (dto == null || dto.Items == null || !dto.Items.Any())
                    return BadRequest(new { success = false, message = "No items in order" });

                decimal subtotal = 0;
                var orderItems = new List<OrderItem>();

                // Build order items and validate stock
                foreach (var item in dto.Items)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                        return BadRequest(new { success = false, message = $"Product {item.ProductId} not found" });

                    if (product.Stock < item.Quantity)
                        return BadRequest(new { success = false, message = $"Insufficient stock for {product.Name}" });

                    var lineTotal = product.Price * item.Quantity;
                    subtotal += lineTotal;

                    orderItems.Add(new OrderItem
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        Price = product.Price,
                        Quantity = item.Quantity,
                        Image = product.Image
                    });

                    // Decrease stock
                    product.Stock -= item.Quantity;
                    product.Sold += item.Quantity;
                }

                var shippingFee = subtotal >= 1000 ? 0m : 60m;
                var discount = dto.Discount ?? 0m;
                var total = subtotal + shippingFee - discount;

                var orderNumber = "KNV-" + DateTime.Now.ToString("yyyyMMddHHmmss");

                var order = new Order
                {
                    OrderNumber = orderNumber,
                    UserId = userId,
                    Total = total,
                    Shipping = shippingFee,
                    Discount = discount,
                    Status = "pending",
                    PaymentMethod = dto.PaymentMethod ?? "cod",
                    ShippingAddress = dto.ShippingAddress,
                    City = dto.City,
                    PostCode = dto.PostCode,
                    Phone = dto.Phone,
                    Email = dto.Email,
                    DeliveryNote = dto.DeliveryNote,
                    CreatedAt = DateTime.UtcNow,
                    EstimatedDelivery = DateTime.UtcNow.AddDays(7),
                    Items = orderItems
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    message = "Order placed",
                    orderId = order.Id,
                    orderNumber = order.OrderNumber,
                    total = order.Total
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* GET: /api/orders  (admin) — all orders */
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllOrders()
        {
            try
            {
                var orders = await _context.Orders
                    .OrderByDescending(o => o.CreatedAt)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        o.UserId,
                        o.Total,
                        o.Shipping,
                        o.Discount,
                        o.Status,
                        o.PaymentMethod,
                        o.CreatedAt,
                        o.EstimatedDelivery,
                        ItemCount = o.Items.Count
                    })
                    .ToListAsync();

                return Ok(new { success = true, orders, count = orders.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* GET: /api/orders/my  (auth) — current user's orders */
        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.CreatedAt)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        o.Total,
                        o.Shipping,
                        o.Discount,
                        o.Status,
                        o.PaymentMethod,
                        o.ShippingAddress,
                        o.City,
                        o.Phone,
                        o.CreatedAt,
                        o.EstimatedDelivery,
                        Items = o.Items.Select(i => new
                        {
                            i.Id,
                            i.ProductId,
                            i.ProductName,
                            i.Price,
                            i.Quantity,
                            i.Image
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(new { success = true, orders, count = orders.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* GET: /api/orders/{id}  (auth) */
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetOrder(int id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var order = await _context.Orders
                    .Where(o => o.Id == id)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        o.UserId,
                        o.Total,
                        o.Shipping,
                        o.Discount,
                        o.Status,
                        o.PaymentMethod,
                        o.ShippingAddress,
                        o.City,
                        o.PostCode,
                        o.Phone,
                        o.Email,
                        o.DeliveryNote,
                        o.CreatedAt,
                        o.EstimatedDelivery,
                        Items = o.Items.Select(i => new
                        {
                            i.Id,
                            i.ProductId,
                            i.ProductName,
                            i.Price,
                            i.Quantity,
                            i.Image
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (order == null)
                    return NotFound(new { success = false, message = "Order not found" });

                return Ok(new { success = true, order });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* PATCH: /api/orders/{id}/status  (admin) */
        [HttpPatch("{id}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { success = false, message = "Order not found" });

                order.Status = dto.Status ?? order.Status;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Status updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* PATCH: /api/orders/{id}/cancel  (auth) */
        [HttpPatch("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelOrder(int id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

                if (order == null)
                    return NotFound(new { success = false, message = "Order not found" });

                if (order.Status == "delivered" || order.Status == "cancelled")
                    return BadRequest(new { success = false, message = "Cannot cancel this order" });

                order.Status = "cancelled";
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Order cancelled" });
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

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public string? PaymentMethod { get; set; }
        public string? ShippingAddress { get; set; }
        public string? City { get; set; }
        public string? PostCode { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? DeliveryNote { get; set; }
        public decimal? Discount { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public string? Status { get; set; }
    }
}