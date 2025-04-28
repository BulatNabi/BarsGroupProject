using CoursesAPI.Models;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Data; 

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Test> Tests { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseProgress> CourseProgresses { get; set; }
    public DbSet<LessonProgress> LessonProgresses { get; set; }
    public DbSet<TestResult> TestResults { get; set; }

    public DbSet<Message> Messages { get; set; }
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Course>()
            .HasOne(c => c.Owner)
            .WithMany(u => u.OwnedCourses)
            .HasForeignKey(c => c.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<User>()
            .HasMany(u => u.Courses)
            .WithMany(c => c.Users)
            .UsingEntity(j => j.ToTable("UserCourses"));

        builder.Entity<Course>()
            .HasMany(c => c.Lessons)
            .WithOne(l => l.Course)
            .HasForeignKey(l => l.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Lesson>()
            .HasMany(l => l.Tests)
            .WithOne(t => t.Lesson)
            .HasForeignKey(t => t.LessonId) 
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<User>()
            .HasMany(u => u.CourseProgresses)
            .WithOne(cp => cp.User)
            .HasForeignKey(cp => cp.UserId)  
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Course>()
            .HasMany(c => c.CourseProgresses)
            .WithOne(cp => cp.Course)
            .HasForeignKey(cp => cp.CourseId) 
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CourseProgress>()
            .HasMany(cp => cp.LessonProgresses)
            .WithOne(lp => lp.CourseProgress)
            .HasForeignKey(lp => lp.CourseProgressId) 
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<User>()
            .HasMany(u => u.LessonProgresses)
            .WithOne(lp => lp.User)
            .HasForeignKey(lp => lp.UserId) 
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Lesson>()
            .HasMany(l => l.LessonProgresses)
            .WithOne(lp => lp.Lesson)
            .HasForeignKey(lp => lp.LessonId) 
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<User>()
            .HasMany(u => u.TestResults)
            .WithOne(tr => tr.User)
            .HasForeignKey(tr => tr.UserId) 
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Test>()
            .HasMany(t => t.TestResults)
            .WithOne(tr => tr.Test)
            .HasForeignKey(tr => tr.TestId) 
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<LessonProgress>()
            .HasMany(lp => lp.TestResults)
            .WithOne(tr => tr.LessonProgress)
            .HasForeignKey(tr => tr.LessonProgressId) 
            .OnDelete(DeleteBehavior.Cascade);

        List<IdentityRole> roles = new List<IdentityRole>
        {
            new IdentityRole
            {
                Name = "Admin",
                NormalizedName = "ADMIN"
            },

            new IdentityRole
            {
                Name = "User",
                NormalizedName = "USER"
            }
        };
        builder.Entity<IdentityRole>().HasData(roles);
    }
}