using System.ComponentModel.DataAnnotations;

namespace CoursesAPI.Dtos.User;

public class RegisterDto
{
    [Required]
    public string? Username { get; set; }
    [Required]
    public string? TelegramUsername { get; set; }
    [Required]
    [EmailAddress]
    public string? Email { get; set; }
    [Required]
    public string? Password { get; set; }
    
    
}