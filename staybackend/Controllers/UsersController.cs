 using KenovaBackend.Data;
using KenovaBackend.DTOs;
using KenovaBackend.Models;
using KenovaBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace KenovaBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;
        private readonly PasswordService _passwordService;

        public UsersController(
            AppDbContext context,
            JwtService jwtService,
            PasswordService passwordService)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordService = passwordService;
        }

        /* ========================================================
           REGISTER
           POST /api/users/register
           ======================================================== */
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password))
                return BadRequest(new { success = false, error = "Email and password are required" });

            if (dto.Password.Length < 6)
                return BadRequest(new { success = false, error = "Password must be at least 6 characters" });

            var exists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (exists)
                return BadRequest(new { success = false, error = "Email already registered" });

            var user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                PasswordHash = _passwordService.Hash(dto.Password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Account created successfully", userId = user.Id });
        }

        /* ========================================================
           LOGIN
           POST /api/users/login
           ======================================================== */
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrEmpty(dto.EmailOrPhone) || string.IsNullOrEmpty(dto.Password))
                return BadRequest(new { success = false, error = "Email/phone and password required" });

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.EmailOrPhone || u.Phone == dto.EmailOrPhone);

            if (user == null)
                return Unauthorized(new { success = false, error = "Email or phone not found" });

            if (!_passwordService.Verify(dto.Password, user.PasswordHash))
                return Unauthorized(new { success = false, error = "Incorrect password" });

            var token = _jwtService.GenerateToken(user);

            return Ok(new
            {
                success = true,
                token,
                user = new
                {
                    id = user.Id,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    phone = user.Phone,
                    avatar = user.Avatar,
                    points = user.Points
                }
            });
        }

        /* ========================================================
           GET PROFILE
           GET /api/users/profile
           ======================================================== */
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null) return NotFound();

            return Ok(new
            {
                success = true,
                user = new
                {
                    id = user.Id,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    phone = user.Phone,
                    bio = user.Bio,
                    dateOfBirth = user.DateOfBirth,
                    gender = user.Gender,
                    avatar = user.Avatar,
                    address = user.Address,
                    city = user.City,
                    postCode = user.PostCode,
                    points = user.Points
                }
            });
        }

        /* ========================================================
           UPDATE PROFILE
           PUT /api/users/profile
           ======================================================== */
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(dto.FirstName)) user.FirstName = dto.FirstName;
            if (!string.IsNullOrEmpty(dto.LastName)) user.LastName = dto.LastName;
            if (!string.IsNullOrEmpty(dto.Email)) user.Email = dto.Email;
            if (!string.IsNullOrEmpty(dto.Phone)) user.Phone = dto.Phone;
            if (dto.Bio != null) user.Bio = dto.Bio;
            if (dto.DateOfBirth != null) user.DateOfBirth = dto.DateOfBirth;
            if (dto.Gender != null) user.Gender = dto.Gender;
            if (dto.Avatar != null) user.Avatar = dto.Avatar;
            if (dto.Address != null) user.Address = dto.Address;
            if (dto.City != null) user.City = dto.City;
            if (dto.PostCode != null) user.PostCode = dto.PostCode;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Profile updated successfully" });
        }

        /* ========================================================
           CHANGE PASSWORD
           POST /api/users/change-password
           ======================================================== */
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null) return NotFound();

            if (!_passwordService.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest(new { success = false, error = "Current password is incorrect" });

            if (dto.NewPassword.Length < 6)
                return BadRequest(new { success = false, error = "Password must be at least 6 characters" });

            user.PasswordHash = _passwordService.Hash(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Password updated successfully" });
        }

        /* ========================================================
           DELETE ACCOUNT
           DELETE /api/users/profile
           ======================================================== */
        [HttpDelete("profile")]
        [Authorize]
        public async Task<IActionResult> DeleteAccount()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Account deleted" });
        }

        /* ========================================================
           HELPER
           ======================================================== */
        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }
}