using CoursesAPI.Data;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Service;

[Authorize]
public class ChatHubService : Hub
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;


    public ChatHubService(UserManager<User> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }


    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;

        if (userId != null)
        {

            var user = await _context.Users
                .Include(u => u.Courses)
                .Include(u => u.OwnedCourses)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user != null)
            {


                foreach (var course in user.Courses)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"Course_{course.Id}");
                }

                foreach (var course in user.OwnedCourses)
                {

                    await Groups.AddToGroupAsync(Context.ConnectionId, $"Course_{course.Id}");
                }



                if (await _userManager.IsInRoleAsync(user, "Admin"))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "AdminSupport");
                }
            }
        }

        await base.OnConnectedAsync();
    }


    public async Task SendMessageToUser(string targetUserId, string messageContent)
    {
        var senderUserId = Context.UserIdentifier;
        if (senderUserId == null) return;


        var message = new Message
        {
            SenderId = senderUserId,
            Content = messageContent,
            Timestamp = DateTimeOffset.UtcNow,
            ChatType = "Private",
            PrivateChatRecipientId = targetUserId

        };


        _context.Messages.Add(message);
        await _context.SaveChangesAsync();


        var messageId = message.Id;
        var timestamp = message.Timestamp;


        await Clients.User(targetUserId).SendAsync("ReceiveMessage", senderUserId, messageContent, senderUserId,
            messageId, timestamp);


        await Clients.Caller.SendAsync("ReceiveMessage", senderUserId, messageContent, targetUserId, messageId,
            timestamp);


    }


    public async Task SendMessageToCourseGroup(string courseId, string messageContent)
    {
        var senderUserId = Context.UserIdentifier;
        if (senderUserId == null) return;


        var courseIdInt = int.Parse(courseId);
        var user = await _context.Users
            .Include(u => u.Courses)
            .Include(u => u.OwnedCourses)
            .FirstOrDefaultAsync(u => u.Id == senderUserId);

        bool isParticipant = user != null && (user.Courses.Any(c => c.Id == courseIdInt) ||
                                              user.OwnedCourses.Any(c => c.Id == courseIdInt));

        if (!isParticipant)
        {
            return;
        }


        var message = new Message
        {
            SenderId = senderUserId,
            Content = messageContent,
            Timestamp = DateTimeOffset.UtcNow,
            ChatType = "Course",
            CourseId = courseIdInt

        };


        _context.Messages.Add(message);
        await _context.SaveChangesAsync();


        var messageId = message.Id;
        var timestamp = message.Timestamp;


        await Clients.Group($"Course_{courseId}").SendAsync("ReceiveMessage", senderUserId, messageContent, courseId,
            messageId, timestamp);
    }


    public async Task SendMessageToAdminSupport(string messageContent)
    {
        var senderUserId = Context.UserIdentifier;
        if (senderUserId == null) return;

        var senderUser = await _userManager.FindByIdAsync(senderUserId);
        var senderInfo = senderUser?.UserName ?? senderUserId;


        var message = new Message
        {
            SenderId = senderUserId,
            Content = messageContent,
            Timestamp = DateTimeOffset.UtcNow,
            ChatType = "AdminSupport",

        };


        _context.Messages.Add(message);
        await _context.SaveChangesAsync();


        var messageId = message.Id;
        var timestamp = message.Timestamp;



        await Clients.Group("AdminSupport").SendAsync("ReceiveMessage", senderUserId, messageContent, "AdminSupport",
            messageId, timestamp);


        await Clients.Caller.SendAsync("ReceiveMessage", "Система", "Ваше сообщение отправлено администраторам.",
            "AdminSupportConfirmation", 0,
            DateTimeOffset.UtcNow); 
    }

}