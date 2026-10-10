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
    public class WishlistController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WishlistController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetWishlist()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var items = await _context.Wishlist
                    .Where(w => w.UserId == userId)
                    .OrderByDescending(w => w.AddedAt)
                    .Select(w => new
                    {
                        w.Id,
                        w.ProductId,
                        w.AddedAt,
                        Product = _context.Products
                            .Where(p => p.Id == w.ProductId)
                            .Select(p => new
                            {
                                p.Id,
                                p.Name,
                                p.Brand,
                                p.Price,
                                p.OldPrice,
                                p.Discount,
                                p.Image,
                                p.Category,
                                p.Stock,
                                p.Rating,
                                p.Reviews
                            })
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddToWishlist([FromBody] AddWishlistDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                if (dto == null || dto.ProductId <= 0)
                    return BadRequest(new { success = false, message = "Invalid product ID" });

                var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
                if (!productExists)
                    return NotFound(new { success = false, message = "Product not found" });

                var existing = await _context.Wishlist
                    .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == dto.ProductId);

                if (existing != null)
                    return Ok(new { success = true, message = "Already in wishlist" });

                var wishlist = new Wishlist
                {
                    UserId = userId,
                    ProductId = dto.ProductId,
                    AddedAt = DateTime.UtcNow
                };

                _context.Wishlist.Add(wishlist);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Added to wishlist",
                    wishlistId = wishlist.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{productId}")]
        [Authorize]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var item = await _context.Wishlist
                    .FirstOrDefaultAsync(w => w.UserId == userId && w.ProductId == productId);

                if (item == null)
                    return NotFound(new { success = false, message = "Not in wishlist" });

                _context.Wishlist.Remove(item);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Removed from wishlist" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete]
        [Authorize]
        public async Task<IActionResult> ClearWishlist()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var items = await _context.Wishlist
                    .Where(w => w.UserId == userId)
                    .ToListAsync();

                _context.Wishlist.RemoveRange(items);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Wishlist cleared" });
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

    public class AddWishlistDto
    {
        public int ProductId { get; set; }
    }
}