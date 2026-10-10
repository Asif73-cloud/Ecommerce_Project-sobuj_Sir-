using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KenovaBackend.Data;

namespace KenovaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BrandsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BrandsController(AppDbContext context)
        {
            _context = context;
        }

        /* ====================================================================
           GET: /api/brands
           Returns only active brands
           ==================================================================== */
        [HttpGet]
        public async Task<IActionResult> GetBrands()
        {
            try
            {
                var brands = await _context.Brands
                    .Where(b => b.IsActive)
                    .OrderBy(b => b.Name)
                    .Select(b => new
                    {
                        b.Id,
                        b.Name,
                        b.Slug,
                        b.Description,
                        b.IsActive,
                        b.CreatedAt
                    })
                    .ToListAsync();

                return Ok(brands);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           GET: /api/brands/{id}
           ==================================================================== */
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBrand(int id)
        {
            try
            {
                var brand = await _context.Brands
                    .Where(b => b.Id == id)
                    .Select(b => new
                    {
                        b.Id,
                        b.Name,
                        b.Slug,
                        b.Description,
                        b.IsActive,
                        b.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (brand == null)
                    return NotFound(new { success = false, message = "Brand not found" });

                return Ok(brand);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           POST: /api/brands  (admin)
           ==================================================================== */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateBrand([FromBody] CreateBrandDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Name))
                    return BadRequest(new { success = false, message = "Name is required" });

                // Auto-generate slug from name if not provided
                var slug = string.IsNullOrWhiteSpace(dto.Slug)
                    ? dto.Name.ToLower().Replace(" ", "-")
                    : dto.Slug;

                // Check duplicates
                var nameExists = await _context.Brands.AnyAsync(b => b.Name == dto.Name);
                if (nameExists)
                    return BadRequest(new { success = false, message = "Brand name already exists" });

                var brand = new Models.Brand
                {
                    Name = dto.Name,
                    Slug = slug,
                    Description = dto.Description,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Brands.Add(brand);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Brand created",
                    brandId = brand.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           PUT: /api/brands/{id}  (admin)
           ==================================================================== */
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateBrand(int id, [FromBody] CreateBrandDto dto)
        {
            try
            {
                var brand = await _context.Brands.FindAsync(id);
                if (brand == null)
                    return NotFound(new { success = false, message = "Brand not found" });

                if (!string.IsNullOrWhiteSpace(dto.Name))
                    brand.Name = dto.Name;

                if (!string.IsNullOrWhiteSpace(dto.Slug))
                    brand.Slug = dto.Slug;

                brand.Description = dto.Description ?? brand.Description;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Brand updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           DELETE: /api/brands/{id}  (admin)
           ==================================================================== */
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteBrand(int id)
        {
            try
            {
                var brand = await _context.Brands.FindAsync(id);
                if (brand == null)
                    return NotFound(new { success = false, message = "Brand not found" });

                _context.Brands.Remove(brand);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Brand deleted" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    /* ========================================================================
       DTO
       ======================================================================== */
    public class CreateBrandDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string? Description { get; set; }
    }
}