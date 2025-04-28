FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /app
EXPOSE 8080

WORKDIR /src

COPY ["CoursesAPI.csproj", "."]
RUN dotnet restore "CoursesAPI.csproj"

COPY . .

RUN dotnet build "CoursesAPI.csproj" -c Release -o /app/build

FROM build AS publish
WORKDIR /src

RUN dotnet publish "CoursesAPI.csproj" -c Release -o /app/publish

RUN dotnet tool install --global dotnet-ef
ENV PATH="$PATH:/root/.dotnet/tools"

RUN dotnet ef migrations script --idempotent --output /app/migrations.sql --startup-project .
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client dos2unix && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .

COPY --from=publish /app/migrations.sql /app/migrations.sql
COPY --from=publish /root/.dotnet/tools /root/.dotnet/tools/
ENV PATH="$PATH:/root/.dotnet/tools"
COPY entrypoint.sh .
RUN dos2unix entrypoint.sh
RUN chmod +x entrypoint.sh
ENTRYPOINT ["dotnet", "CoursesAPI.dll"]