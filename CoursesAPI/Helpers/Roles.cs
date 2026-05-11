using System.Security.Claims;

namespace CoursesAPI;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Teacher = "Teacher";
    public const string User = "User";

    public const string AdminOrTeacher = Admin + "," + Teacher;
}

public static class ClaimsPrincipalRoleExtensions
{
    public static bool IsAdmin(this ClaimsPrincipal user) => user.IsInRole(Roles.Admin);
    public static bool IsTeacher(this ClaimsPrincipal user) => user.IsInRole(Roles.Teacher);
    public static bool IsTeacherOrAdmin(this ClaimsPrincipal user) =>
        user.IsInRole(Roles.Admin) || user.IsInRole(Roles.Teacher);
}
