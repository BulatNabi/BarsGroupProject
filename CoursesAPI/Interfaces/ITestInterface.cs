using CoursesAPI.Models;
namespace CoursesAPI.Interfaces;


public interface ITestInterface
{
    Task<List<Test>> CreateTestAsync(Lesson lesson, List<Test> test);
    Task<Test> UpdateTestAsync(Test test);
    Task<List<Test>> GetAllTestsAsync();
    Task<Test?> GetTestByIdAsync(int testId);
    Task<List<Test>?> GetAllTestsByLessonIdAsync(int lessonId);
    Task<Test?> DeleteTestByIdAsync(int testId);
}