using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CoursesAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Interfaces;


public interface ICourseProgressInterface
{
    Task<CourseProgress?> GetCourseProgressByCourseAndUserIdAsync(int courseId, string userId);
    Task<List<CourseProgress>?> GetCourseProgressByUserIdAsync(string userId);
    Task<CourseProgress?> CreateCourseProgressAsync(CourseProgress? courseProgress);
    Task<List<CourseProgress>?> GetCourseProgressByCourseIdAsync(int courseId);
    Task<List<CourseProgress>> GetCourseProgressesAsync();
}