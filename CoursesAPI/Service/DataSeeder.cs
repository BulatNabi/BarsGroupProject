using CoursesAPI.Data;
using CoursesAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CoursesAPI.Service;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services, ILogger logger)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;

        var db = sp.GetRequiredService<ApplicationDbContext>();
        await db.Database.MigrateAsync();

        var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var role in new[] { Roles.Admin, Roles.Teacher, Roles.User })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created missing role {Role}", role);
            }
        }

        var config = sp.GetRequiredService<IConfiguration>();
        var email = config["SeedAdmin:Email"];
        var username = config["SeedAdmin:Username"];
        var password = config["SeedAdmin:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("SeedAdmin credentials not configured; skipping admin user seeding.");
            return;
        }

        var userManager = sp.GetRequiredService<UserManager<User>>();
        var existing = await userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            if (!await userManager.IsInRoleAsync(existing, Roles.Admin))
            {
                var currentRoles = await userManager.GetRolesAsync(existing);
                await userManager.RemoveFromRolesAsync(existing, currentRoles);
                await userManager.AddToRoleAsync(existing, Roles.Admin);
                logger.LogInformation("Upgraded existing user {Email} to Admin", email);
            }
            return;
        }

        var admin = new User
        {
            UserName = username,
            Email = email,
            EmailConfirmed = true,
            BirthdayDate = DateTime.UtcNow
        };

        var create = await userManager.CreateAsync(admin, password);
        if (!create.Succeeded)
        {
            logger.LogError("Failed to create seed admin: {Errors}",
                string.Join(", ", create.Errors.Select(e => e.Description)));
            return;
        }

        var roleAdd = await userManager.AddToRoleAsync(admin, Roles.Admin);
        if (!roleAdd.Succeeded)
        {
            logger.LogError("Failed to assign Admin role to seed user: {Errors}",
                string.Join(", ", roleAdd.Errors.Select(e => e.Description)));
            return;
        }

        logger.LogInformation("Seeded admin user {Email}", email);
    }
}
