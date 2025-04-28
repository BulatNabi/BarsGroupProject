using CoursesAPI.Data;
using CoursesAPI.Interfaces;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;
namespace CoursesAPI.Repository;

public class LessonRepository : ILessonInterface
{
    private readonly ApplicationDbContext _context;

    public LessonRepository(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Lesson> CreateLessonAsync(Lesson lesson)
    {
        await _context.Lessons.AddAsync(lesson);
        await _context.SaveChangesAsync();
        return lesson;
    }
    public async Task<Lesson?> UpdateLessonAsync(Lesson lesson)
    {
        var existingLesson = await _context.Lessons.FindAsync(lesson.Id);
        if (existingLesson == null)
        {
            return null; 
        }

        _context.Entry(existingLesson).CurrentValues.SetValues(lesson);
        _context.Entry(existingLesson).State = EntityState.Modified;

        await _context.SaveChangesAsync();
        return existingLesson;
       
    }
    public async Task<List<Lesson>?> GetAllLessonsAsync()
    {
        return await _context.Lessons.ToListAsync();
    }

    public async Task<List<Lesson>?> GetLessonsByCourseIdAsync(int courseId)
    {
        return await _context.Lessons
            .Where(lesson => lesson.CourseId == courseId)
            .Include(lesson => lesson.Tests)
            .Select(l => new Lesson
            {
                Id = l.Id,
                CourseId = l.CourseId,
                Name = l.Name,
                Description = l.Description,
                CreateDate = l.CreateDate,
                VideoKeys = l.VideoKeys,
                LectureKeys = l.LectureKeys,
                PhotoKeys = l.PhotoKeys,
                Tests = l.Tests.Select(t => new Test 
                {
                    Id = t.Id,
                    LessonId = t.LessonId,
                    Question = t.Question,
                    Answers = t.Answers,
                    CorrectAnswer = t.CorrectAnswer
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task<Lesson?> GetLessonByIdAsync(int lessonId)
    {
        return await _context.Lessons
            .Where(l => l.Id == lessonId)
            .Include( c=> c.Tests)
            .FirstOrDefaultAsync();
    }
    public async Task<Lesson?> DeleteLessonByIdAsync(int lessonId)
    {
        var deleteLesson = await _context.Lessons.FindAsync(lessonId);

        if (deleteLesson == null) return null;

        _context.Lessons.Remove(deleteLesson);
        await _context.SaveChangesAsync();
        return deleteLesson;
    }
    public async Task<Lesson?> UpdateVideoKeysAsync(Lesson lesson, List<string> videoKeys)
    {
        lesson.VideoKeys = videoKeys;
        await _context.SaveChangesAsync();
        return lesson;
    }
    public async Task<Lesson?> UpdatePhotoKeysAsync(Lesson lesson, List<string> photoKeys)
    {
        lesson.PhotoKeys = photoKeys;
        await _context.SaveChangesAsync();
        return lesson;
    }
    public async Task<Lesson?> UpdateLectureKeysAsync(Lesson lesson, List<string> lectureKeys)
    {
        lesson.LectureKeys = lectureKeys;
        await _context.SaveChangesAsync();
        return lesson;
    }
    public async Task<Lesson?> UpdateBookKeysAsync(Lesson lesson, List<string> bookKeys)
    {
        lesson.BookKeys = bookKeys;
        await _context.SaveChangesAsync();
        return lesson;
    }
    public async Task<Lesson?> UpdateAudioKeysAsync(Lesson lesson, List<string> audioKeys)
    {
        lesson.AudioKeys = audioKeys;
        await _context.SaveChangesAsync();
        return lesson;
    }
    public async Task<Lesson?> AddTestToLessonAsync(Lesson lesson, Test test)
    {
        lesson.Tests.Add(test);
        await _context.SaveChangesAsync();
        return lesson;
    }
    
}