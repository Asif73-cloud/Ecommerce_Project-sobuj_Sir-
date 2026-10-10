 using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KenovaBackend.Data;
using KenovaBackend.Models;

namespace KenovaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        /* ====================================================================
           GET: /api/products
           Query params: search, category, brand, min, max, rating, sort, page, limit
           ==================================================================== */
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            string? search,
            string? category,
            int? brand,
            decimal? min,
            decimal? max,
            int? rating,
            string? sort,
            int page = 1,
            int limit = 20)
        {
            try
            {
                var query = _context.Products.AsQueryable();

                // Filter: active only
                query = query.Where(p => p.IsActive);

                // Search in name, brand, category
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var s = search.ToLower();
                    query = query.Where(p =>
                        p.Name.ToLower().Contains(s) ||
                        (p.Brand != null && p.Brand.ToLower().Contains(s)) ||
                        (p.Category != null && p.Category.ToLower().Contains(s)));
                }

                // Category filter (by slug or name)
                if (!string.IsNullOrWhiteSpace(category) && category != "all")
                {
                    var cat = category.ToLower();
                    query = query.Where(p =>
                        p.Category != null && p.Category.ToLower() == cat);
                }

                // Brand filter
                if (brand.HasValue)
                {
                    query = query.Where(p => p.BrandId == brand.Value);
                }

                // Price range
                if (min.HasValue)
                    query = query.Where(p => p.Price >= min.Value);

                if (max.HasValue)
                    query = query.Where(p => p.Price <= max.Value);

                // Rating filter
                if (rating.HasValue && rating.Value > 0)
                    query = query.Where(p => p.Rating >= rating.Value);

                // Sort
                query = sort switch
                {
                    "price-low" => query.OrderBy(p => p.Price),
                    "price-high" => query.OrderByDescending(p => p.Price),
                    "rating" => query.OrderByDescending(p => p.Rating),
                    "newest" => query.OrderByDescending(p => p.Id),
                    _ => query.OrderBy(p => p.Id)
                };

                var total = await query.CountAsync();

                var products = await query
                    .Skip((page - 1) * limit)
                    .Take(limit)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Brand,
                        p.Description,
                        p.Price,
                        p.OldPrice,
                        p.Discount,
                        p.Rating,
                        p.Reviews,
                        p.Image,
                        p.Category,
                        p.Slug,
                        p.SKU,
                        p.BrandId,
                        p.CategoryId,
                        p.Stock,
                        p.Sold,
                        p.Views,
                        p.IsActive,
                        p.IsFeatured
                    })
                    .ToListAsync();

                return Ok(new
                {
                    success = true,
                    products,
                    totalCount = total,
                    page,
                    limit,
                    totalPages = (int)Math.Ceiling((double)total / limit)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           GET: /api/products/{id}
           ==================================================================== */
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            try
            {
                var product = await _context.Products
                    .Where(p => p.Id == id)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.Brand,
                        p.Description,
                        p.Price,
                        p.OldPrice,
                        p.Discount,
                        p.Rating,
                        p.Reviews,
                        p.Image,
                        p.Category,
                        p.Slug,
                        p.SKU,
                        p.BrandId,
                        p.CategoryId,
                        p.Stock,
                        p.Sold,
                        p.Views,
                        p.IsActive,
                        p.IsFeatured
                    })
                    .FirstOrDefaultAsync();

                if (product == null)
                    return NotFound(new { success = false, message = "Product not found" });

                return Ok(new { success = true, product });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           POST: /api/products  (Admin only — add later)
           ==================================================================== */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateProduct([FromBody] Product product)
        {
            try
            {
                if (product == null)
                    return BadRequest(new { success = false, message = "Invalid product data" });

                product.CreatedAt = DateTime.UtcNow;
                product.UpdatedAt = DateTime.UtcNow;

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Product created",
                    productId = product.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           PUT: /api/products/{id}
           ==================================================================== */
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product update)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                    return NotFound(new { success = false, message = "Product not found" });

                product.Name = update.Name ?? product.Name;
                product.Description = update.Description ?? product.Description;
                product.Price = update.Price > 0 ? update.Price : product.Price;
                product.OldPrice = update.OldPrice ?? product.OldPrice;
                product.Discount = update.Discount;
                product.Image = update.Image ?? product.Image;
                product.Category = update.Category ?? product.Category;
                product.Brand = update.Brand ?? product.Brand;
                product.Stock = update.Stock;
                product.IsActive = update.IsActive;
                product.IsFeatured = update.IsFeatured;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Product updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           DELETE: /api/products/{id}
           ==================================================================== */
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                    return NotFound(new { success = false, message = "Product not found" });

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Product deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}