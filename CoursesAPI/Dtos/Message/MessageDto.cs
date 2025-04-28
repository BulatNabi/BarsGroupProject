namespace CoursesAPI.Dtos.Message;

public class MessageDto
{
    public int Id { get; set; }
    public string SenderId { get; set; }
    public string SenderUserName { get; set; } // Или другое имя для отображения
    public string Content { get; set; }
    public DateTimeOffset Timestamp { get; set; }
    public string ChatType { get; set; }
    // В зависимости от ChatType, можно добавить Identifier (CourseId, PrivateRecipientId)
    // Но для отображения истории, ChatType и Sender/Content/Timestamp обычно достаточно.
}