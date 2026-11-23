# Stack profile: .NET API (ASP.NET Core minimal API)

## Overview

A typed REST API in C#.

| Layer | Choice |
| --- | --- |
| Runtime | .NET 10 (LTS) |
| HTTP | ASP.NET Core **minimal APIs** + built-in OpenAPI |
| Data | PostgreSQL + Entity Framework Core (Npgsql provider) + EF migrations |
| Unit tests | xUnit + `WebApplicationFactory` (in-memory test server) |
| Acceptance tests | **Reqnroll** (the open-source successor of SpecFlow) on xUnit |
| App folder | `apps/api` |

## When to pick it

- Your team or company works in C# / .NET, or runs on Azure and Microsoft tooling.
- You want strong typing, great IDE support (Visual Studio, Rider, VS Code C# Dev Kit) and fast runtime performance.
- **Pick another profile** if nobody on the team knows C# — the language is not the place to learn under deadline.

## Commands

```bash
dotnet new sln -n Api -o apps/api
cd apps/api
dotnet new webapi -n Api -o src/Api                     # minimal APIs are the default
dotnet new xunit -n Api.Tests -o tests/Api.Tests
dotnet new xunit -n Api.Specs -o tests/Api.Specs
dotnet sln add src/Api tests/Api.Tests tests/Api.Specs
dotnet add tests/Api.Tests reference src/Api
dotnet add tests/Api.Specs reference src/Api
dotnet add tests/Api.Tests package Microsoft.AspNetCore.Mvc.Testing
dotnet add tests/Api.Specs package Microsoft.AspNetCore.Mvc.Testing
dotnet add tests/Api.Specs package Reqnroll.xUnit
dotnet add src/Api package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add src/Api package Microsoft.EntityFrameworkCore.Design
dotnet tool install --global dotnet-ef
```

| Task | Command | Used by |
| --- | --- | --- |
| Run (dev, hot reload) | `dotnet watch --project src/Api` | you |
| Build | `dotnet build` | verify |
| Tests (unit + Reqnroll) | `dotnet test` | verify |
| One scenario | `dotnet test --filter "Category=LUNCH-03"` | `/build` |
| Format | `dotnet format` | you, CI |
| New migration | `dotnet ef migrations add AddPolls --project src/Api` | after model changes |
| Apply migrations | `dotnet ef database update --project src/Api` | local, deploy |

## Layout

```
apps/api/
  Api.slnx                         solution (.NET 10 creates .slnx by default)
  src/Api/Program.cs               endpoints, DI, /health
  src/Api/Data/AppDbContext.cs
  src/Api/Migrations/              EF migrations — commit them
  tests/Api.Tests/                 xUnit unit/integration tests
  tests/Api.Specs/                 Reqnroll step definitions (feature files linked from specs/)
  Dockerfile  .dockerignore  .env.example
```

`src/Api/Program.cs` (port and health endpoint):

```csharp
var builder = WebApplication.CreateBuilder(args);

// Clouds tell the container which port to use through PORT.
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

public partial class Program; // lets WebApplicationFactory<Program> find the app in tests
```

## Testing & BDD runner

Link the feature files from the spec folders into `tests/Api.Specs/Api.Specs.csproj` (linked feature files need Reqnroll 3.3+ with code-behind generated into `obj/`):

```xml
<PropertyGroup>
  <ReqnrollUseIntermediateOutputPathForCodeBehind>true</ReqnrollUseIntermediateOutputPathForCodeBehind>
</PropertyGroup>
<ItemGroup>
  <None Include="..\..\..\..\specs\*\02-scenarios\*.feature" Link="Features\%(RecursiveDir)%(Filename)%(Extension)" />
</ItemGroup>
```

`tests/Api.Specs/Steps/HealthSteps.cs` — Reqnroll creates a fresh instance of a binding class for every scenario and disposes it afterwards, so each scenario gets its own in-memory test server:

```csharp
using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Reqnroll;
using Xunit;

[Binding]
public sealed class HealthSteps : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory = new();
    private HttpResponseMessage? _response;

    [When("I request {string}")]
    public async Task WhenIRequest(string path) =>
        _response = await _factory.CreateClient().GetAsync(path);

    [Then("the response status is {int}")]
    public void ThenTheResponseStatusIs(int status) =>
        Assert.Equal((HttpStatusCode)status, _response!.StatusCode);

    public void Dispose() => _factory.Dispose();
}
```

Gherkin tags become test categories, so `--filter "Category=api"` runs API scenarios.

## Container

`apps/api/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Api/Api.csproj src/Api/
RUN dotnet restore src/Api/Api.csproj
COPY src/ src/
RUN dotnet publish src/Api/Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV PORT=8080
COPY --from=build /app/publish .
# The official images ship a non-root "app" user; APP_UID is its numeric ID.
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Api.dll"]
```

`.dockerignore`: `**/bin`, `**/obj`, `.git`, `.env*`, `!.env.example`, `tests`.

Health path for deploys: **`/health`**.

## Cloud fit

| Cloud | Service | Notes |
| --- | --- | --- |
| Azure | Container Apps | Natural home for .NET teams; `az containerapp up --source apps/api` |
| Google Cloud | Cloud Run | `gcloud run deploy --source apps/api` |
| AWS | ECS Express Mode | `docker build --platform linux/amd64`, push to ECR |

## Junior gotchas

- **Never commit `appsettings.Development.json` secrets.** Use `dotnet user-secrets` locally and the cloud secret manager in production; environment variables override `appsettings.json` (`ConnectionStrings__Default`).
- **`public partial class Program;`** at the bottom of `Program.cs` is required for `WebApplicationFactory<Program>` in tests.
- **Async all the way:** use `await` with EF Core (`ToListAsync`), never `.Result` or `.Wait()` — they can deadlock and waste threads.
- **Review EF migrations** before committing; a rename can be generated as drop + add, which loses data.
- **Do not use `EnsureCreated()`** outside quick prototypes — it bypasses migrations.
