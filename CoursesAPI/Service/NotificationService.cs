using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Service;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ITelegramSender _telegram;

    public NotificationService(ApplicationDbContext context, ITelegramSender telegram)
    {
        _context = context;
        _telegram = telegram;
    }

    public async Task<Notification> CreateAsync(string userId, string type, string title, string body)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        if (_telegram.IsConfigured)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user?.TelegramUserId != null)
            {
                var message = $"{title}\n\n{body}";
                var ok = await _telegram.SendToChatAsync(user.TelegramUserId.Value, message);
                if (ok)
                {
                    notification.TelegramDelivered = true;
                    await _context.SaveChangesAsync();
                }
            }
        }

        return notification;
    }
}
