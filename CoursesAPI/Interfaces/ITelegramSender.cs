namespace CoursesAPI.Interfaces;

public interface ITelegramSender
{
    bool IsConfigured { get; }
    Task<bool> SendToChatAsync(long chatId, string text);
}
