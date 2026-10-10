using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KenovaBackend.Data;

namespace KenovaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        /* ====================================================================
           GET: /api/categories
           Returns categories as tree (root categories with children)
           ==================================================================== */
        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var all = await _context.Categories
                    .OrderBy(c => c.SortOrder)
                    .ThenBy(c => c.Name)
                    .Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.Slug,
                        c.ParentId,
                        c.Icon,
                        c.SortOrder,
                        c.CreatedAt
                    })
                    .ToListAsync();

                // Build tree
                var roots = all.Where(c => c.ParentId == null).ToList();

                var tree = roots.Select(root => new
                {
                    root.Id,
                    root.Name,
                    root.Slug,
                    root.Icon,
                    root.SortOrder,
                    Children = all
                        .Where(c => c.ParentId == root.Id)
                        .Select(child => new
                        {
                            child.Id,
                            child.Name,
                            child.Slug,
                            child.Icon,
                            child.SortOrder
                        })
                        .ToList()
                }).ToList();

                return Ok(tree);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           GET: /api/categories/flat
           Returns flat list (no tree)
           ==================================================================== */
        [HttpGet("flat")]
        public async Task<IActionResult> GetFlatCategories()
        {
            try
            {
                var categories = await _context.Categories
                    .OrderBy(c => c.SortOrder)
                    .ThenBy(c => c.Name)
                    .Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.Slug,
                        c.ParentId,
                        c.Icon,
                        c.SortOrder
                    })
                    .ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           GET: /api/categories/{id}
           ==================================================================== */
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            try
            {
                var category = await _context.Categories
                    .Where(c => c.Id == id)
                    .Select(c => new
                    {
                        c.Id,
                        c.Name,
                        c.Slug,
                        c.ParentId,
                        c.Icon,
                        c.SortOrder,
                        c.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (category == null)
                    return NotFound(new { success = false, message = "Category not found" });

                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           POST: /api/categories  (admin)
           ==================================================================== */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Name))
                    return BadRequest(new { success = false, message = "Name is required" });

                if (string.IsNullOrWhiteSpace(dto.Slug))
                    return BadRequest(new { success = false, message = "Slug is required" });

                // Check duplicate slug
                var exists = await _context.Categories.AnyAsync(c => c.Slug == dto.Slug);
                if (exists)
                    return BadRequest(new { success = false, message = "Slug already exists" });

                var category = new Models.Category
                {
                    Name = dto.Name,
                    Slug = dto.Slug,
                    ParentId = dto.ParentId,
                    Icon = dto.Icon,
                    SortOrder = dto.SortOrder,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Category created",
                    categoryId = category.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           PUT: /api/categories/{id}  (admin)
           ==================================================================== */
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CreateCategoryDto dto)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                    return NotFound(new { success = false, message = "Category not found" });

                if (!string.IsNullOrWhiteSpace(dto.Name))
                    category.Name = dto.Name;

                if (!string.IsNullOrWhiteSpace(dto.Slug))
                    category.Slug = dto.Slug;

                category.ParentId = dto.ParentId;
                category.Icon = dto.Icon;
                category.SortOrder = dto.SortOrder;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Category updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* ====================================================================
           DELETE: /api/categories/{id}  (admin)
           ==================================================================== */
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                    return NotFound(new { success = false, message = "Category not found" });

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Category deleted" });
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
    public class CreateCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public string? Icon { get; set; }
        public int SortOrder { get; set; } = 0;
    }
}