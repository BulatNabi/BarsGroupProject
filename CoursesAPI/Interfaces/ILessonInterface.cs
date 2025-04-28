using CoursesAPI.Models;
namespace CoursesAPI.Interfaces;


public interface ILessonInterface
{
    Task<Lesson> CreateLessonAsync(Lesson lesson);
    Task<List<Lesson>?> GetLessonsByCourseIdAsync(int courseId);
    Task<Lesson?> GetLessonByIdAsync(int lessonId);
    Task<Lesson?> DeleteLessonByIdAsync(int lessonId);
    Task<Lesson?> UpdateLessonAsync(Lesson lesson);
    Task<Lesson?> UpdateVideoKeysAsync(Lesson lesson, List<string> videoKeys);
    Task<Lesson?> UpdatePhotoKeysAsync(Lesson lesson, List<string> photoKeys);
    Task<Lesson?> UpdateLectureKeysAsync(Lesson lesson, List<string> lectureKeys);
    Task<Lesson?> UpdateBookKeysAsync(Lesson lesson, List<string> bookKeys);
    Task<Lesson?> UpdateAudioKeysAsync(Lesson lesson, List<string> audioKeys);
    Task<Lesson?> AddTestToLessonAsync(Lesson lesson, Test test);
}