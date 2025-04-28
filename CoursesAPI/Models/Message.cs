namespace CoursesAPI.Models;
    public class Message
    {
        public int Id { get; set; }
        public string SenderId { get; set; }
        public User Sender { get; set; } 
        public string Content { get; set; }
        public DateTimeOffset Timestamp { get; set; } 
        public string ChatType { get; set; } 
        public string? PrivateChatRecipientId { get; set; } 
        public User? PrivateChatRecipient { get; set; } 
        public int? CourseId { get; set; } 
        public Course? Course { get; set; }

    }
