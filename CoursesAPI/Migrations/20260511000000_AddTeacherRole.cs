using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CoursesAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename the existing "Admin" role to "Teacher". The row Id is preserved
            // so existing AspNetUserRoles links remain valid — every former Admin
            // becomes a Teacher automatically.
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "fa7ae7d7-712b-40db-a53f-03b88c93c4a0",
                columns: new[] { "Name", "NormalizedName" },
                values: new object[] { "Teacher", "TEACHER" });

            // Add the new platform-wide Admin role. Admin users are seeded at startup
            // by DataSeeder using UserManager (proper password hashing).
            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "Id", "ConcurrencyStamp", "Name", "NormalizedName" },
                values: new object[] { "1b9c2bc1-9c3d-4b8e-8a1a-2d3d3d3d3d3d", null, "Admin", "ADMIN" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1b9c2bc1-9c3d-4b8e-8a1a-2d3d3d3d3d3d");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "fa7ae7d7-712b-40db-a53f-03b88c93c4a0",
                columns: new[] { "Name", "NormalizedName" },
                values: new object[] { "Admin", "ADMIN" });
        }
    }
}
