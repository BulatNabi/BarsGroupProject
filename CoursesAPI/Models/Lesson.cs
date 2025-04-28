namespace CoursesAPI.Models;
using System.Collections;
using Newtonsoft.Json;
using System.Collections;
using Microsoft.AspNetCore.Identity;
using Newtonsoft.Json;
public class Lesson
{
    public Course Course { get; set; }

    public int Id { get; set; }
    public string? Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public DateTime CreateDate { get; set; } = DateTime.Now;
    public List<string> VideoKeys { get; set; } = new List<string>();
    public List<string> LectureKeys { get; set; } = new List<string>();
    public List<string> PhotoKeys { get; set; } = new List<string>();
    public List<string> BookKeys { get; set; } = new List<string>();
    public List<string> AudioKeys { get; set; } = new List<string>();
    public List<string> TextLectures { get; set; } = new List<string>();
    public List<Test> Tests { get; set; } = new List<Test>();
    public List<TestResult> TestResults { get; set; } = new List<TestResult>();
    public List<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
}