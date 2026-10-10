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
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        /* ====================================================================
           GET: /api/reviews/product/{productId}
           Get all reviews for a specific product
           ==================================================================== */
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductReviews(int productId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.ProductId,
                    r.UserId,
                    r.Rating,
                    r.Comment,
                    r.IsApproved,
                    r.CreatedAt,
                    UserName = _context.Users
                        .Where(u => u.Id == r.UserId)
                        .Select(u => u.FirstName + " " + u.LastName)
                        .FirstOrDefault(),
                    ProductName = _context.Products
                        .Where(p => p.Id == r.ProductId)
                        .Select(p => p.Name)
                        .FirstOrDefault(),
                    ProductImage = _context.Products
                        .Where(p => p.Id == r.ProductId)
                        .Select(p => p.Image)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new { success = true, reviews, count = reviews.Count });
        }

        /* ====================================================================
           GET: /api/reviews/user/{userId}
           Get all reviews by a specific user
           ==================================================================== */
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserReviews(int userId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.ProductId,
                    r.UserId,
                    r.Rating,
                    r.Comment,
                    r.IsApproved,
                    r.CreatedAt,
                    ProductName = _context.Products
                        .Where(p => p.Id == r.ProductId)
                        .Select(p => p.Name)
                        .FirstOrDefault(),
                    ProductImage = _context.Products
                        .Where(p => p.Id == r.ProductId)
                        .Select(p => p.Image)
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new { success = true, reviews, count = reviews.Count });
        }

        /* ====================================================================
           POST: /api/reviews
           Create a new review (auth required)
           ==================================================================== */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            if (dto == null || dto.Rating < 1 || dto.Rating > 5)
            {
                return BadRequest(new { success = false, message = "Rating must be between 1 and 5" });
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
            {
                return NotFound(new { success = false, message = "Product not found" });
            }

            // Check for existing review
            var existing = await _context.Reviews
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ProductId == dto.ProductId);

            if (existing != null)
            {
                existing.Rating = dto.Rating;
                existing.Comment = dto.Comment ?? "";
                existing.IsApproved = true;
                existing.CreatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Review updated",
                    reviewId = existing.Id
                });
            }

            var review = new Review
            {
                ProductId = dto.ProductId,
                UserId = userId,
                Rating = dto.Rating,
                Comment = dto.Comment ?? "",
                IsApproved = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Review created",
                reviewId = review.Id
            });
        }

        /* ====================================================================
           PUT: /api/reviews/{id}
           Update an existing review (auth required)
           ==================================================================== */
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] CreateReviewDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(new { success = false, message = "Review not found" });
            }

            if (review.UserId != userId)
            {
                return Forbid();
            }

            if (dto.Rating < 1 || dto.Rating > 5)
            {
                return BadRequest(new { success = false, message = "Rating must be between 1 and 5" });
            }

            review.Rating = dto.Rating;
            review.Comment = dto.Comment ?? review.Comment;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Review updated" });
        }

        /* ====================================================================
           DELETE: /api/reviews/{id}
           Delete a review (auth required)
           ==================================================================== */
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { success = false, message = "User not authenticated" });
            }

            var review = await _context.Reviews.FindAsync(id);
            if (review == null)
            {
                return NotFound(new { success = false, message = "Review not found" });
            }

            var isAdmin = User.IsInRole("admin") || User.IsInRole("Admin");
            if (review.UserId != userId && !isAdmin)
            {
                return Forbid();
            }

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Review deleted" });
        }
    }

    /* ========================================================================
       DTO for creating / updating reviews
       ======================================================================== */
    public class CreateReviewDto
    {
        public int ProductId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}