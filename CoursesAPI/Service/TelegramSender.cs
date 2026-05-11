using System.Text;
using System.Text.Json;
using CoursesAPI.Interfaces;

namespace CoursesAPI.Service;

public class TelegramSender : ITelegramSender
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string? _botToken;
    private readonly ILogger<TelegramSender> _logger;

    public TelegramSender(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<TelegramSender> logger)
    {
        _botToken = configuration["ConnectionStrings:BotToken"];
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_botToken);

    public async Task<bool> SendToChatAsync(long chatId, string text)
    {
        if (!IsConfigured)
        {
            _logger.LogDebug("Telegram not configured; skipping send to {ChatId}", chatId);
            return false;
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
            var payload = JsonSerializer.Serialize(new { chat_id = chatId, text });
            using var content = new StringContent(payload, Encoding.UTF8, "application/json");
            using var response = await client.PostAsync(url, content);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Telegram sendMessage returned {Status}: {Body}", (int)response.StatusCode, body);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Telegram sendMessage failed");
            return false;
        }
    }
}
