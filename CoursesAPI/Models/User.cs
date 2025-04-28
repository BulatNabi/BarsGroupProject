using System.Collections;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Identity;
using Newtonsoft.Json;

namespace CoursesAPI.Models;
public class User : IdentityUser
{
    public int Age { get; set; }
    public int? TelegramUserId { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? TelegramUsername { get; set; }
    public string? ProfilePhotoKey { get; set; }
    public DateTime BirthdayDate { get; set; }
    public List<Course> OwnedCourses { get; set; } = new List<Course>();
    public List<CourseProgress> CourseProgresses { get; set; } = new List<CourseProgress>();
    public List<Course> Courses { get; set; } = new List<Course>();
    public List<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>(); 
    public List<TestResult> TestResults { get; set; } = new List<TestResult>(); 
}