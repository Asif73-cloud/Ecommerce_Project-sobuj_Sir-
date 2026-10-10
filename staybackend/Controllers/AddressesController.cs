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
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AddressesController(AppDbContext context)
        {
            _context = context;
        }

        /* GET: /api/addresses  (auth) */
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAddresses()
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var addresses = await _context.Addresses
                    .Where(a => a.UserId == userId)
                    .OrderByDescending(a => a.IsDefault)
                    .ThenByDescending(a => a.Id)
                    .Select(a => new
                    {
                        a.Id,
                        a.Label,
                        a.FullName,
                        a.Phone,
                        a.Street,
                        a.City,
                        a.PostCode,
                        a.Country,
                        a.IsDefault,
                        a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(addresses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* GET: /api/addresses/{id}  (auth) */
        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetAddress(int id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var address = await _context.Addresses
                    .Where(a => a.Id == id && a.UserId == userId)
                    .Select(a => new
                    {
                        a.Id,
                        a.Label,
                        a.FullName,
                        a.Phone,
                        a.Street,
                        a.City,
                        a.PostCode,
                        a.Country,
                        a.IsDefault,
                        a.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (address == null)
                    return NotFound(new { success = false, message = "Address not found" });

                return Ok(address);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* POST: /api/addresses  (auth) */
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateAddress([FromBody] CreateAddressDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                if (string.IsNullOrWhiteSpace(dto.FullName) ||
                    string.IsNullOrWhiteSpace(dto.Phone) ||
                    string.IsNullOrWhiteSpace(dto.Street) ||
                    string.IsNullOrWhiteSpace(dto.City))
                {
                    return BadRequest(new { success = false, message = "Required fields missing" });
                }

                // If this is the first address, make it default
                var existingCount = await _context.Addresses.CountAsync(a => a.UserId == userId);
                var isDefault = existingCount == 0 || dto.IsDefault;

                // If setting as default, unset others
                if (isDefault)
                {
                    var others = await _context.Addresses
                        .Where(a => a.UserId == userId && a.IsDefault)
                        .ToListAsync();
                    others.ForEach(a => a.IsDefault = false);
                }

                var address = new Address
                {
                    UserId = userId,
                    Label = dto.Label ?? "Home",
                    FullName = dto.FullName,
                    Phone = dto.Phone,
                    Street = dto.Street,
                    City = dto.City,
                    PostCode = dto.PostCode,
                    Country = dto.Country ?? "Bangladesh",
                    IsDefault = isDefault,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Address created",
                    addressId = address.Id
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* PUT: /api/addresses/{id}  (auth) */
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] CreateAddressDto dto)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var address = await _context.Addresses
                    .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

                if (address == null)
                    return NotFound(new { success = false, message = "Address not found" });

                if (!string.IsNullOrWhiteSpace(dto.FullName)) address.FullName = dto.FullName;
                if (!string.IsNullOrWhiteSpace(dto.Phone)) address.Phone = dto.Phone;
                if (!string.IsNullOrWhiteSpace(dto.Street)) address.Street = dto.Street;
                if (!string.IsNullOrWhiteSpace(dto.City)) address.City = dto.City;
                if (!string.IsNullOrWhiteSpace(dto.Label)) address.Label = dto.Label;

                address.PostCode = dto.PostCode ?? address.PostCode;
                address.Country = dto.Country ?? address.Country;

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Address updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* PUT: /api/addresses/{id}/default  (auth) */
        [HttpPut("{id}/default")]
        [Authorize]
        public async Task<IActionResult> SetDefault(int id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var others = await _context.Addresses
                    .Where(a => a.UserId == userId)
                    .ToListAsync();

                var target = others.FirstOrDefault(a => a.Id == id);
                if (target == null)
                    return NotFound(new { success = false, message = "Address not found" });

                others.ForEach(a => a.IsDefault = (a.Id == id));
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Default address updated" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        /* DELETE: /api/addresses/{id}  (auth) */
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0) return Unauthorized();

                var address = await _context.Addresses
                    .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

                if (address == null)
                    return NotFound(new { success = false, message = "Address not found" });

                _context.Addresses.Remove(address);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Address deleted" });
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

    public class CreateAddressDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string? PostCode { get; set; }
        public string? Country { get; set; }
        public string? Label { get; set; }
        public bool IsDefault { get; set; } = false;
    }
}