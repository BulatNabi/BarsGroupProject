using CoursesAPI.Data;
using CoursesAPI.Dtos.Message;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")] 
public class ChatHistoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;

    public ChatHistoryController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }
    private string? GetCurrentUserId()
    {
        return _userManager.GetUserId(User);
    }

    
    [HttpGet("GetCurrentUserId")] 
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(string))]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<string> GetCurrentUserIdEndpoint()
    {
        var currentUserId = GetCurrentUserId();

        if (currentUserId == null)
        {
            
            return Unauthorized();
        }

        
        return Ok(currentUserId);
    }
    
    [HttpGet("private/{otherUserId}")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetPrivateChatHistory(string otherUserId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var otherUserExists = await _userManager.FindByIdAsync(otherUserId) != null;
        if (!otherUserExists)
        {
            return NotFound("Другой пользователь не найден.");
        }

        var messages = await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatType == "Private" &&
                        ((m.SenderId == currentUserId && m.PrivateChatRecipientId == otherUserId) ||
                         (m.SenderId == otherUserId && m.PrivateChatRecipientId == currentUserId)))
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        var messageDtos = messages.Select(m => new MessageDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            SenderUserName = m.Sender?.UserName ?? "Неизвестный",
            Content = m.Content,
            Timestamp = m.Timestamp,
            ChatType = m.ChatType
        }).ToList();

        return Ok(messageDtos);
    }


    
    [HttpGet("course/{courseId}")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetCourseChatHistory(int courseId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        var user = await _context.Users
            .Include(u => u.Courses)
            .Include(u => u.OwnedCourses)
            .FirstOrDefaultAsync(u => u.Id == currentUserId);

        var course = await _context.Courses.FindAsync(courseId);

        if (course == null || user == null || (user.Courses.All(c => c.Id != courseId) && user.OwnedCourses.All(c => c.Id != courseId)))
        {
            return Forbid(); 
        }

        var messages = await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatType == "Course" && m.CourseId == courseId)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        var messageDtos = messages.Select(m => new MessageDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            SenderUserName = m.Sender?.UserName ?? "Неизвестный",
            Content = m.Content,
            Timestamp = m.Timestamp,
            ChatType = m.ChatType
        }).ToList();

        return Ok(messageDtos);
    }


    
    [HttpGet("admin-support")]
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetAdminSupportHistoryForUser()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null) return Unauthorized();

        
         var messages = await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ChatType == "AdminSupport" && m.SenderId == currentUserId) 
            
            .OrderBy(m => m.Timestamp)
            .ToListAsync();


        var messageDtos = messages.Select(m => new MessageDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            SenderUserName = m.Sender?.UserName ?? "Неизвестный",
            Content = m.Content,
            Timestamp = m.Timestamp,
            ChatType = m.ChatType
        }).ToList();

        return Ok(messageDtos);
    }


    

    [HttpGet("admin-support/all")]
    [Authorize(Roles = "Admin")] 
    public async Task<ActionResult<IEnumerable<MessageDto>>> GetAllAdminSupportHistory()
    {
        

        
        var messages = await _context.Messages
            .Include(m => m.Sender) 
            .Where(m => m.ChatType == "AdminSupport")
            .OrderBy(m => m.Timestamp) 
            .ToListAsync();

        
        var messageDtos = messages.Select(m => new MessageDto
        {
            Id = m.Id,
            SenderId = m.SenderId,
            
            SenderUserName = m.Sender?.UserName ?? "Неизвестный",
            Content = m.Content,
            Timestamp = m.Timestamp,
            ChatType = m.ChatType 
        }).ToList();

        return Ok(messageDtos);
    }
}