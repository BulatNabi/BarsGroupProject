using System.Security.Claims;
using CoursesAPI.Data;
using CoursesAPI.Dtos.Feedback;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Controllers;

[ApiController]
[Route("api/feedback")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FeedbackController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<FeedbackDto>> Create([FromBody] FeedbackCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto?.Subject) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest("Subject and message are required.");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        if (dto.Subject.Length > 200) dto.Subject = dto.Subject[..200];
        if (dto.Message.Length > 4000) dto.Message = dto.Message[..4000];

        var entity = new Feedback
        {
            UserId = userId,
            Subject = dto.Subject.Trim(),
            Message = dto.Message.Trim(),
            Status = "Open",
            CreatedAt = DateTime.UtcNow
        };
        _context.Feedbacks.Add(entity);
        await _context.SaveChangesAsync();

        return Ok(Map(entity, null));
    }

    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<FeedbackDto>>> GetMine()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var items = await _context.Feedbacks
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .Include(f => f.User)
            .ToListAsync();

        return Ok(items.Select(f => Map(f, f.User)));
    }

    private static FeedbackDto Map(Feedback f, User? user) => new()
    {
        Id = f.Id,
        UserId = f.UserId,
        Username = user?.UserName,
        Email = user?.Email,
        Subject = f.Subject,
        Message = f.Message,
        Status = f.Status,
        AdminReply = f.AdminReply,
        CreatedAt = f.CreatedAt,
        RepliedAt = f.RepliedAt,
    };
}
