using CoursesAPI.Models;
namespace CoursesAPI.Interfaces;


public interface ILessonProgressInterface
{
    Task<LessonProgress?> AddTestResultToLessonProgressAsync(TestResult testResult, LessonProgress lessonProgress);
    Task<LessonProgress> UpdateLessonProgressForNewLessonsAsync(LessonProgress lessonProgress, CourseProgress courseProgress);
    Task<LessonProgress?> GetLessonProgressByUserAndLessonIdAsync(string userId, int lessonId);
}