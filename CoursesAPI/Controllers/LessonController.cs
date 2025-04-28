using System.Security.Claims;
using System.Text;
using CoursesAPI.Models;
using CoursesAPI.Dtos.Lesson;
using CoursesAPI.Dtos.TestDto;
using CoursesAPI.Helpers;
using CoursesAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Controllers
{
    [Route("api/courses/{courseId}/lessons")]
    [ApiController]
    [Authorize]
    public class LessonsController : ControllerBase
    {
        private readonly ILessonInterface _lessonRepository;
        private readonly ILessonProgressInterface _lessonProgressRepository;
        private readonly ICourseProgressInterface _courseProgressRepository;
        private readonly ICourseInterface _courseRepository;
        private readonly UserManager<User> _userManager;
        private readonly IS3Interface _s3;

        public LessonsController(
            ILessonInterface lessonRepository,
            ICourseInterface courseRepository,
            UserManager<User> userManager,
            IS3Interface s3Service,
            ILessonProgressInterface lessonProgressRepository,
            ICourseProgressInterface courseProgressRepository)
        {
            _lessonRepository = lessonRepository;
            _courseRepository = courseRepository;
            _userManager = userManager;
            _s3 = s3Service;
            _lessonProgressRepository = lessonProgressRepository;
            _courseProgressRepository = courseProgressRepository;
        }

        private async Task<(Course? course, IActionResult? forbiddenResult)> CheckCourseAccessAsync(int courseId,
            bool requireOwnerOrAdmin = false)
        {
            var course = await _courseRepository.GetCourseByIdAsync(courseId);
            if (course == null)
            {
                return (null, NotFound($"Курс с ID {courseId} не найден."));
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
            {
                return (null, Unauthorized("Не удалось определить пользователя."));
            }

            bool isOwner = course.OwnerId == currentUserId;
            bool isAdmin = User.IsInRole("Admin");

            if (requireOwnerOrAdmin)
            {
                if (!isOwner && !isAdmin)
                {
                    return (course, Forbid());
                }
            }
            else
            {
                bool isEnrolled = await _courseRepository.IsUserEnrolledAsync(courseId, currentUserId);
                if (!isOwner && !isAdmin && !isEnrolled)
                {
                    return (course, Forbid());
                }
            }

            return (course, null);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonViewModelDto>>> GetLessons(int courseId)
        {

            var lessons = await _lessonRepository.GetLessonsByCourseIdAsync(courseId);
            if (lessons == null)
            {
                lessons = new List<Lesson>();
            }

            var lessonViewModelTasks = lessons.Select(async l =>
            {
                
                var testViewModels = l.Tests.Select(c => new TestViewModelDto
                {
                    Id = c.Id,
                    Question = c.Question,
                    Answers = c.Answers,
                    CorrectAnswer = c.CorrectAnswer
                }).ToList();

                
                return new LessonViewModelDto
                {
                    Id = l.Id,
                    CourseId = l.CourseId,
                    Name = l.Name,
                    Description = l.Description,
                    CreateDate = l.CreateDate,
                    TextLectures = l.TextLectures,
                    VideoKeys = l.VideoKeys.Select(key => _s3.GetFileUrl(key)).ToList().ToList(),
                    LectureKeys = l.LectureKeys.Select(key => _s3.GetFileUrl(key)).ToList(),
                    PhotoKeys = l.PhotoKeys.Select(key => _s3.GetFileUrl(key)).ToList(),
                    BooksKeys = l.BookKeys.Select(key => _s3.GetFileUrl(key)).ToList(), 
                    AudioKeys = l.AudioKeys.Select(key => _s3.GetFileUrl(key)).ToList(),
                    Tests = testViewModels
                };
            }); 
            var lessonViewModels = (await Task.WhenAll(lessonViewModelTasks)).ToList();

            return Ok(lessonViewModels);
        }

        [HttpGet("{lessonId}")]
        public async Task<ActionResult<LessonViewModelDto>> GetLesson(int courseId, int lessonId)
        {
            var accessCheck = await CheckCourseAccessAsync(courseId);
            if (accessCheck.forbiddenResult != null) return Forbid();

            var lesson = await _lessonRepository.GetLessonByIdAsync(lessonId);

            if (lesson == null || lesson.CourseId != courseId)
            {
                return NotFound($"Урок с ID {lessonId} не найден в курсе {courseId}.");
            }

            
            
            var lessonViewModel = new LessonViewModelDto
            {
                
                Id = lesson.Id,
                CourseId = lesson.CourseId,
                Name = lesson.Name,
                Description = lesson.Description,
                CreateDate = lesson.CreateDate,
                TextLectures = lesson.TextLectures,
                VideoKeys = lesson.VideoKeys.Select(key => _s3.GetFileUrl(key)).ToList().ToList(),
                LectureKeys = lesson.LectureKeys.Select(key => _s3.GetFileUrl(key)).ToList(),
                PhotoKeys = lesson.PhotoKeys.Select(key => _s3.GetFileUrl(key)).ToList(),
                BooksKeys = lesson.BookKeys.Select(key => _s3.GetFileUrl(key)).ToList(), 
                AudioKeys = lesson.AudioKeys.Select(key => _s3.GetFileUrl(key)).ToList(),
                Tests = lesson.Tests.Select(c => new TestViewModelDto
                {
                    Id = c.Id,
                    Question = c.Question,
                    Answers = c.Answers,
                    CorrectAnswer = c.CorrectAnswer
                }).ToList()
            };

            return Ok(lessonViewModel);
        }

        
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [DisableRequestSizeLimit]
        public async Task<ActionResult<LessonViewModelDto>> CreateLesson(int courseId, LessonCreateModelDto createModel)
        {
            var accessCheck = await CheckCourseAccessAsync(courseId, requireOwnerOrAdmin: true);
            if (accessCheck.forbiddenResult != null)  return Forbid();

            var lesson = new Lesson
            {
                CourseId = courseId,
                Name = createModel.Name,
                Description = createModel.Description,
                VideoKeys = new List<string>(),
                PhotoKeys = new List<string>(),
                LectureKeys = new List<string>(),
                BookKeys = new List<string>(),
                AudioKeys = new List<string>(),
                TextLectures = createModel.TextLectures ?? new List<string>(),
                CreateDate = DateTime.UtcNow,
                Tests = new List<Test>(),
                TestResults = new List<TestResult>(),
                LessonProgresses = new List<LessonProgress>()
            };
            var createdLesson = await _lessonRepository.CreateLessonAsync(lesson);


            if (createModel.Videos != null)
            {
                var videoKeys = await CreateFileKeys(createModel.Videos, courseId, createdLesson.Id);
                await _lessonRepository.UpdateVideoKeysAsync(createdLesson, videoKeys);
            }

            if (createModel.Lectures != null)
            {
                var lectureKeys = await CreateFileKeys(createModel.Lectures, courseId, createdLesson.Id);
                await _lessonRepository.UpdateLectureKeysAsync(createdLesson, lectureKeys);
            }
            
            if (createModel.Photos != null)
            {
                var photoKeys = await CreateFileKeys(createModel.Photos, courseId, createdLesson.Id);
                await _lessonRepository.UpdatePhotoKeysAsync(createdLesson, photoKeys);
            }

            if (createModel.Books != null)
            {
                var booksKeys =await CreateFileKeys(createModel.Books, courseId, createdLesson.Id);
                await _lessonRepository.UpdateBookKeysAsync(createdLesson, booksKeys);
            }

            if (createModel.Audios != null)
            {
                var audioKeys = await CreateFileKeys(createModel.Audios, courseId, createdLesson.Id);
                await _lessonRepository.UpdateAudioKeysAsync(createdLesson, audioKeys);
            }

            var enrolledUsers = await _courseRepository.GetEnrolledUsersAsync(courseId);
            foreach (var user in enrolledUsers)
            {
                var courseProgress = await _courseProgressRepository.GetCourseProgressByCourseAndUserIdAsync(courseId, user.Id);

                var lessonProgress = new LessonProgress
                {
                    UserId = user.Id,
                    CourseProgress = courseProgress,
                    CourseProgressId = courseProgress.Id,
                    Lesson = lesson,
                    LessonId = lesson.Id
                };
                await _lessonProgressRepository.UpdateLessonProgressForNewLessonsAsync(lessonProgress,
                    courseProgress);
            }

            var endLesson = await _lessonRepository.GetLessonByIdAsync(createdLesson.Id);
            
            var lessonViewModel = new LessonViewModelDto
            {
                Id = endLesson.Id,
                CourseId = endLesson.CourseId,
                Name = endLesson.Name,
                Description = endLesson.Description,
                CreateDate = endLesson.CreateDate,
                TextLectures = endLesson.TextLectures,
                VideoKeys = endLesson.VideoKeys.Select( key => new string( _s3.GetFileUrl(key))).ToList(),
                LectureKeys = endLesson.LectureKeys.Select(key => new string( _s3.GetFileUrl(key))).ToList(),
                PhotoKeys = endLesson.PhotoKeys.Select(key => new string(_s3.GetFileUrl(key))).ToList(),
                BooksKeys = endLesson.BookKeys.Select(key => new string(_s3.GetFileUrl(key))).ToList(),
                AudioKeys = endLesson.AudioKeys.Select(key => new string(_s3.GetFileUrl(key))).ToList(),
            };

            return CreatedAtAction(nameof(GetLesson), new { courseId = courseId, lessonId = createdLesson.Id },
                lessonViewModel);
            }
        

        [HttpPut("{lessonId}")]
        [Authorize(Roles = "Admin")]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> UpdateLesson(int courseId, int lessonId, LessonUpdateModelDto updateModel)
        {
            var accessCheck = await CheckCourseAccessAsync(courseId, requireOwnerOrAdmin: true);
            if (accessCheck.forbiddenResult != null) return accessCheck.forbiddenResult;

            var existingLesson = await _lessonRepository.GetLessonByIdAsync(lessonId);

            if (existingLesson == null || existingLesson.CourseId != courseId)
            {
                return NotFound($"Урок с ID {lessonId} не найден в курсе {courseId}.");
            }
            existingLesson.Name = updateModel.Name;
            existingLesson.Description = updateModel.Description;
            if(updateModel.TextLectures!= null)
                existingLesson.TextLectures = updateModel.TextLectures;
            if (updateModel.Videos != null)
            { 
                var videoKeys = await CreateFileKeys(updateModel.Videos, courseId, lessonId);
                if (updateModel.VideosKeys != null && updateModel.VideosKeys.Any())
                {
                    var existingKeysFromUrls = updateModel.VideosKeys
                        .Select(GetObjectKeyFromS3Url)
                        .Where(key => true)
                        .ToList(); 
                    videoKeys.AddRange(existingKeysFromUrls);
                }
                existingLesson.VideoKeys = videoKeys;
            }

            if (updateModel.Lectures != null)
            {
                var lectureKeys = await CreateFileKeys(updateModel.Lectures, courseId, lessonId);
                if (updateModel.LecturesKeys != null && updateModel.LecturesKeys.Any())
                {
                    var existingKeysFromUrls = updateModel.LecturesKeys
                        .Select(GetObjectKeyFromS3Url)
                        .Where(key => true)
                        .ToList(); 
                    lectureKeys.AddRange(existingKeysFromUrls);
                }
                existingLesson.LectureKeys = lectureKeys;
            }
            if (updateModel.Photos != null)
            {
                var photoKeys = await CreateFileKeys(updateModel.Photos, courseId, lessonId);
                if (updateModel.PhotosKeys != null && updateModel.PhotosKeys.Any())
                {
                    var existingKeysFromUrls = updateModel.PhotosKeys
                        .Select(GetObjectKeyFromS3Url)
                        .Where(key => true)
                        .ToList(); 
                    photoKeys.AddRange(existingKeysFromUrls);
                }
                existingLesson.PhotoKeys = photoKeys;
            }

            if (updateModel.Books != null)
            {
                var booksKeys =await CreateFileKeys(updateModel.Books, courseId, lessonId);
                if (updateModel.BooksKeys != null && updateModel.BooksKeys.Any())
                {
                    var existingKeysFromUrls = updateModel.BooksKeys
                        .Select(GetObjectKeyFromS3Url)
                        .Where(key => true)
                        .ToList(); 
                    booksKeys.AddRange(existingKeysFromUrls);
                }
                existingLesson.BookKeys = booksKeys;
            }

            if (updateModel.Audios != null)
            {
                var audioKeys = await CreateFileKeys(updateModel.Audios, courseId, lessonId);
                if (updateModel.AudiosKeys != null && updateModel.AudiosKeys.Any())
                {
                    var existingKeysFromUrls = updateModel.AudiosKeys
                        .Select(GetObjectKeyFromS3Url)
                        .Where(key => true)
                        .ToList(); 
                    audioKeys.AddRange(existingKeysFromUrls);
                }
                existingLesson.AudioKeys = audioKeys;
            }
            
            try
            {
                await _lessonRepository.UpdateLessonAsync(existingLesson);
            }
            catch (DbUpdateConcurrencyException)
            {
                var lessonExists = await _lessonRepository.GetLessonByIdAsync(lessonId) != null;
                if (!lessonExists || (await _lessonRepository.GetLessonByIdAsync(lessonId))?.CourseId != courseId)
                {
                    return NotFound($"Урок с ID {lessonId} больше не существует в курсе {courseId}.");
                }
                else
                {
                    return Conflict("Урок был изменен другим пользователем. Пожалуйста, обновите данные.");
                }
            }
            catch (NullReferenceException)
            {
                return NotFound($"Не удалось обновить урок с ID {lessonId}, т.к. он не найден.");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Ошибка при обновлении урока {lessonId} в курсе {courseId}: {ex.Message}");
                return Problem($"Произошла внутренняя ошибка при обновлении урока.", statusCode: 500);
            }

            return NoContent();
        }

        [HttpDelete("{lessonId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteLesson(int courseId, int lessonId)
        {
            var accessCheck = await CheckCourseAccessAsync(courseId, requireOwnerOrAdmin: true);
            if (accessCheck.forbiddenResult != null) return accessCheck.forbiddenResult;

            var deletedLesson = await _lessonRepository.DeleteLessonByIdAsync(lessonId);

            if (deletedLesson == null)
            {
                return Problem($"Не удалось удалить урок с ID {lessonId}.", statusCode: 500);
            }

            return NoContent();
        }
        private async Task<List<string>> CreateFileKeys(List<IFormFile> files,int courseId, int lessonId)
        {
            var fileKeys = new List<string>();
            foreach (var lectureFile in files)
            {
                var filePath = $"courses/course{courseId}/lessons/lesson{lessonId}";
                var lectureKey = await _s3.UploadFileAsync(lectureFile, filePath);
                fileKeys.Add(lectureKey);
            }
            return fileKeys;
        }
        private string GetObjectKeyFromS3Url(string s3Url)
        {
            if (string.IsNullOrEmpty(s3Url))
                return null;

            if (Uri.TryCreate(s3Url, UriKind.Absolute, out var uri))
            {
                string absolutePath = uri.AbsolutePath;
                return absolutePath.TrimStart('/');
            }
            else
                return null;
        }
    }
}