using System.Text.Json.Serialization;
using GlobalHireLite.Api.Contracts;
using GlobalHireLite.Api.Domain;
using GlobalHireLite.Api.Infrastructure;
using GlobalHireLite.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
builder.Services.AddSingleton<InMemoryGlobalHireStore>();
builder.Services.AddSingleton<AuthorizationService>();
builder.Services.AddSingleton<WorkerService>();
builder.Services.AddSingleton<PayrollService>();
builder.Services.AddSingleton<DashboardService>();

var app = builder.Build();
app.UseCors();

app.MapGet("/api/health", () => Results.Ok(new { ok = true, service = "globalhire-lite-dotnet-api" }));

app.MapPost("/api/auth/login", (LoginRequest input, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var user = store.Users.FirstOrDefault(candidate =>
        candidate.Email.Equals(input.Email, StringComparison.OrdinalIgnoreCase) &&
        candidate.Password == input.Password);
    if (user is null) return Error("Invalid email or password", StatusCodes.Status401Unauthorized);

    context.Response.Cookies.Append("globalhire_user_id", user.Id, new CookieOptions
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = false,
        Expires = DateTimeOffset.UtcNow.AddDays(7)
    });
    return Results.Ok(new { token = user.Id, user = PublicUser(user) });
});

app.MapPost("/api/auth/logout", (HttpContext context) =>
{
    context.Response.Cookies.Delete("globalhire_user_id");
    return Results.NoContent();
});

app.MapGet("/api/auth/me", (HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    return actor is null ? Error("Unauthorized", StatusCodes.Status401Unauthorized) : Results.Ok(PublicUser(actor));
});

app.MapGet("/api/organizations", (HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var orgs = actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST
        ? store.Organizations
        : store.Organizations.Where(org => org.Id == actor.OrganizationId);
    return Results.Ok(orgs);
});

app.MapGet("/api/dashboard", (HttpContext context, InMemoryGlobalHireStore store, DashboardService dashboard) =>
{
    var actor = CurrentUser(context, store);
    return actor is null ? Error("Unauthorized", StatusCodes.Status401Unauthorized) : Results.Ok(dashboard.Snapshot(actor));
});

app.MapGet("/api/workers", (HttpContext context, InMemoryGlobalHireStore store, WorkerService workers, string? search, WorkerStatus? status, string? country, string? department) =>
{
    var actor = CurrentUser(context, store);
    return actor is null ? Error("Unauthorized", StatusCodes.Status401Unauthorized) : Results.Ok(workers.List(actor, search, status, country, department));
});

app.MapGet("/api/workers/{id}", (string id, HttpContext context, InMemoryGlobalHireStore store, WorkerService workers) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var worker = workers.Get(actor, id);
    return worker is null ? Error("Worker not found", StatusCodes.Status404NotFound) : Results.Ok(worker);
});

app.MapPost("/api/workers", (CreateWorkerRequest input, HttpContext context, InMemoryGlobalHireStore store, WorkerService workers) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (actor.Role is not (Role.CLIENT_ADMIN or Role.PLATFORM_ADMIN)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    var (worker, error) = workers.Create(actor, input);
    return error is not null ? Error(error) : Results.Created($"/api/workers/{worker!.Id}", worker);
});

app.MapPatch("/api/workers/{id}", (string id, UpdateWorkerRequest input, HttpContext context, InMemoryGlobalHireStore store, WorkerService workers) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (actor.Role is not (Role.CLIENT_ADMIN or Role.EOR_SPECIALIST or Role.PLATFORM_ADMIN)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    var (worker, error) = workers.Update(actor, id, input);
    return error is not null ? Error(error, error == "Worker not found" ? StatusCodes.Status404NotFound : StatusCodes.Status400BadRequest) : Results.Ok(worker);
});

app.MapPost("/api/workers/{id}/activate", (string id, HttpContext context, InMemoryGlobalHireStore store, WorkerService workers) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (actor.Role is not (Role.CLIENT_ADMIN or Role.EOR_SPECIALIST or Role.PLATFORM_ADMIN)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    var (worker, error) = workers.Activate(actor, id);
    return error is not null ? Error(error) : Results.Ok(worker);
});

app.MapGet("/api/workers/{workerId}/onboarding", (string workerId, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    var worker = store.Workers.FirstOrDefault(item => item.Id == workerId);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (worker is null) return Error("Worker not found", StatusCodes.Status404NotFound);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    return Results.Ok(store.OnboardingTasks.Where(task => task.WorkerId == workerId));
});

app.MapPatch("/api/onboarding-tasks/{taskId}/submit", (string taskId, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var task = store.OnboardingTasks.FirstOrDefault(item => item.Id == taskId);
    if (task is null) return Error("Onboarding task not found", StatusCodes.Status404NotFound);
    task.Status = OnboardingTaskStatus.SUBMITTED;
    task.SubmittedAt = DateTime.UtcNow;
    return Results.Ok(task);
});

app.MapPatch("/api/onboarding-tasks/{taskId}/approve", (string taskId, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (actor.Role is Role.WORKER) return Error("Forbidden", StatusCodes.Status403Forbidden);
    var task = store.OnboardingTasks.FirstOrDefault(item => item.Id == taskId);
    if (task is null) return Error("Onboarding task not found", StatusCodes.Status404NotFound);
    task.Status = OnboardingTaskStatus.APPROVED;
    task.ReviewedById = actor.Id;
    task.ReviewedAt = DateTime.UtcNow;
    task.RejectionReason = null;
    return Results.Ok(task);
});

app.MapPatch("/api/onboarding-tasks/{taskId}/reject", (string taskId, RejectRequest input, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (actor.Role is Role.WORKER) return Error("Forbidden", StatusCodes.Status403Forbidden);
    var task = store.OnboardingTasks.FirstOrDefault(item => item.Id == taskId);
    if (task is null) return Error("Onboarding task not found", StatusCodes.Status404NotFound);
    task.Status = OnboardingTaskStatus.REJECTED;
    task.ReviewedById = actor.Id;
    task.ReviewedAt = DateTime.UtcNow;
    task.RejectionReason = input.RejectionReason;
    return Results.Ok(task);
});

app.MapGet("/api/workers/{workerId}/documents", (string workerId, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    var worker = store.Workers.FirstOrDefault(item => item.Id == workerId);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (worker is null) return Error("Worker not found", StatusCodes.Status404NotFound);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    return Results.Ok(store.Documents.Where(document => document.WorkerId == workerId));
});

app.MapPost("/api/workers/{workerId}/documents", (string workerId, CreateDocumentRequest input, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    var worker = store.Workers.FirstOrDefault(item => item.Id == workerId);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    if (worker is null) return Error("Worker not found", StatusCodes.Status404NotFound);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    var document = new WorkerDocument { WorkerId = workerId, UploadedById = actor.Id, FileName = input.FileName, DocumentType = input.DocumentType };
    store.Documents.Add(document);
    return Results.Created($"/api/workers/{workerId}/documents/{document.Id}", document);
});

app.MapGet("/api/leave-requests", (HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    return Results.Ok(FilterByActorWorkers(actor, store, store.LeaveRequests, leave => leave.WorkerId));
});

app.MapPost("/api/leave-requests", (CreateLeaveRequest input, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var workerId = actor.Role == Role.WORKER ? actor.WorkerId : input.WorkerId;
    if (workerId is null) return Error("workerId is required");
    var worker = store.Workers.FirstOrDefault(item => item.Id == workerId);
    if (worker is null) return Error("Worker not found", StatusCodes.Status404NotFound);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    if (input.EndDate < input.StartDate) return Error("endDate must be on or after startDate");
    var leave = new LeaveRequest { WorkerId = workerId, LeaveType = input.LeaveType, StartDate = input.StartDate, EndDate = input.EndDate, Reason = input.Reason };
    store.LeaveRequests.Add(leave);
    return Results.Created($"/api/leave-requests/{leave.Id}", leave);
});

app.MapPatch("/api/leave-requests/{id}/approve", (string id, HttpContext context, InMemoryGlobalHireStore store) => ReviewLeave(id, LeaveStatus.APPROVED, context, store));
app.MapPatch("/api/leave-requests/{id}/reject", (string id, HttpContext context, InMemoryGlobalHireStore store) => ReviewLeave(id, LeaveStatus.REJECTED, context, store));
app.MapPatch("/api/leave-requests/{id}/cancel", (string id, HttpContext context, InMemoryGlobalHireStore store) => ReviewLeave(id, LeaveStatus.CANCELLED, context, store));

app.MapGet("/api/timesheets", (HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    return Results.Ok(FilterByActorWorkers(actor, store, store.Timesheets, sheet => sheet.WorkerId));
});

app.MapPost("/api/timesheets", (CreateTimesheetRequest input, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var workerId = actor.Role == Role.WORKER ? actor.WorkerId : input.WorkerId;
    if (workerId is null) return Error("workerId is required");
    var worker = store.Workers.FirstOrDefault(item => item.Id == workerId);
    if (worker is null) return Error("Worker not found", StatusCodes.Status404NotFound);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    if (input.RegularHours is < 0 or > 80 || input.OvertimeHours is < 0 or > 80) return Error("Hours must be between 0 and 80");
    var timesheet = new Timesheet { WorkerId = workerId, WeekStartDate = input.WeekStartDate, RegularHours = input.RegularHours, OvertimeHours = input.OvertimeHours, Notes = input.Notes ?? "" };
    store.Timesheets.Add(timesheet);
    return Results.Created($"/api/timesheets/{timesheet.Id}", timesheet);
});

app.MapPatch("/api/timesheets/{id}/submit", (string id, HttpContext context, InMemoryGlobalHireStore store) => ReviewTimesheet(id, TimesheetStatus.SUBMITTED, context, store));
app.MapPatch("/api/timesheets/{id}/approve", (string id, HttpContext context, InMemoryGlobalHireStore store) => ReviewTimesheet(id, TimesheetStatus.APPROVED, context, store));
app.MapPatch("/api/timesheets/{id}/reject", (string id, HttpContext context, InMemoryGlobalHireStore store) => ReviewTimesheet(id, TimesheetStatus.REJECTED, context, store));

app.MapGet("/api/payroll-runs", (HttpContext context, InMemoryGlobalHireStore store, PayrollService payroll) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var runs = actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST
        ? store.PayrollRuns
        : store.PayrollRuns.Where(run => run.OrganizationId == actor.OrganizationId).ToList();
    return Results.Ok(runs.OrderByDescending(run => run.CreatedAt).Select(payroll.WithItems));
});

app.MapGet("/api/payroll-runs/{id}", (string id, HttpContext context, InMemoryGlobalHireStore store, PayrollService payroll) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var run = store.PayrollRuns.FirstOrDefault(item => item.Id == id);
    if (run is null) return Error("Payroll run not found", StatusCodes.Status404NotFound);
    if (!CanAccessOrganization(actor, run.OrganizationId)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    return Results.Ok(payroll.WithItems(run));
});

app.MapPost("/api/payroll-runs", (CreatePayrollRunRequest input, HttpContext context, InMemoryGlobalHireStore store, PayrollService payroll) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var (run, error) = payroll.Create(actor, input);
    return error is not null ? Error(error) : Results.Created($"/api/payroll-runs/{run!.Id}", run);
});

app.MapPost("/api/payroll-runs/{id}/calculate", (string id, HttpContext context, InMemoryGlobalHireStore store, PayrollService payroll) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var (run, error) = payroll.Calculate(actor, id);
    return error is not null ? Error(error) : Results.Ok(run);
});

app.MapPost("/api/payroll-runs/{id}/approve", (string id, HttpContext context, InMemoryGlobalHireStore store, PayrollService payroll) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var (run, error) = payroll.Approve(actor, id);
    return error is not null ? Error(error) : Results.Ok(run);
});

app.MapPost("/api/payroll-runs/{id}/lock", (string id, HttpContext context, InMemoryGlobalHireStore store, PayrollService payroll) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var (run, error) = payroll.Lock(actor, id);
    return error is not null ? Error(error) : Results.Ok(run);
});

app.MapGet("/api/invoices", (HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var invoices = actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST
        ? store.Invoices
        : store.Invoices.Where(invoice => invoice.OrganizationId == actor.OrganizationId).ToList();
    return Results.Ok(invoices);
});

app.MapPost("/api/payroll-runs/{payrollRunId}/invoice", (string payrollRunId, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var run = store.PayrollRuns.FirstOrDefault(item => item.Id == payrollRunId);
    if (run is null) return Error("Payroll run not found", StatusCodes.Status404NotFound);
    if (!CanAccessOrganization(actor, run.OrganizationId)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    if (run.Status is not (PayrollRunStatus.APPROVED or PayrollRunStatus.LOCKED)) return Error("Only approved or locked payroll can be invoiced");
    var existing = store.Invoices.FirstOrDefault(invoice => invoice.PayrollRunId == payrollRunId);
    if (existing is not null) return Results.Ok(existing);
    var subtotal = run.GrossTotal + run.EmployerCostTotal;
    var platformFee = decimal.Round(subtotal * 0.05m, 2);
    var invoice = new Invoice
    {
        OrganizationId = run.OrganizationId,
        PayrollRunId = run.Id,
        InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{store.Invoices.Count + 1:000}",
        Subtotal = subtotal,
        PlatformFee = platformFee,
        Total = subtotal + platformFee,
        Currency = run.Currency,
        DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14))
    };
    store.Invoices.Add(invoice);
    return Results.Created($"/api/invoices/{invoice.Id}", invoice);
});

app.MapGet("/api/offboarding-cases", (HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    return Results.Ok(FilterByActorWorkers(actor, store, store.OffboardingCases, item => item.WorkerId));
});

app.MapPost("/api/offboarding-cases", (CreateOffboardingRequest input, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var worker = store.Workers.FirstOrDefault(item => item.Id == input.WorkerId);
    if (worker is null) return Error("Worker not found", StatusCodes.Status404NotFound);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    var offboarding = new OffboardingCase { WorkerId = worker.Id, RequestedById = actor.Id, Reason = input.Reason, LastWorkingDay = input.LastWorkingDay, Notes = input.Notes };
    store.OffboardingCases.Add(offboarding);
    worker.Status = WorkerStatus.OFFBOARDING;
    return Results.Created($"/api/offboarding-cases/{offboarding.Id}", offboarding);
});

app.MapPatch("/api/offboarding-cases/{id}/{status}", (string id, OffboardingStatus status, HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var offboarding = store.OffboardingCases.FirstOrDefault(item => item.Id == id);
    if (offboarding is null) return Error("Offboarding case not found", StatusCodes.Status404NotFound);
    var worker = store.Workers.First(item => item.Id == offboarding.WorkerId);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    offboarding.Status = status;
    if (status == OffboardingStatus.COMPLETED) worker.Status = WorkerStatus.TERMINATED;
    return Results.Ok(offboarding);
});

app.MapGet("/api/country-rules", (InMemoryGlobalHireStore store) => Results.Ok(store.CountryRules));

app.MapGet("/api/audit-log", (HttpContext context, InMemoryGlobalHireStore store) =>
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var logs = actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST
        ? store.AuditLogs
        : store.AuditLogs.Where(log => log.OrganizationId == actor.OrganizationId).ToList();
    return Results.Ok(logs.OrderByDescending(log => log.CreatedAt));
});

app.Run();

static IResult ReviewLeave(string id, LeaveStatus status, HttpContext context, InMemoryGlobalHireStore store)
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var leave = store.LeaveRequests.FirstOrDefault(item => item.Id == id);
    if (leave is null) return Error("Leave request not found", StatusCodes.Status404NotFound);
    var worker = store.Workers.First(item => item.Id == leave.WorkerId);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    leave.Status = status;
    leave.ReviewedById = actor.Id;
    leave.ReviewedAt = DateTime.UtcNow;
    return Results.Ok(leave);
}

static IResult ReviewTimesheet(string id, TimesheetStatus status, HttpContext context, InMemoryGlobalHireStore store)
{
    var actor = CurrentUser(context, store);
    if (actor is null) return Error("Unauthorized", StatusCodes.Status401Unauthorized);
    var sheet = store.Timesheets.FirstOrDefault(item => item.Id == id);
    if (sheet is null) return Error("Timesheet not found", StatusCodes.Status404NotFound);
    var worker = store.Workers.First(item => item.Id == sheet.WorkerId);
    if (!CanAccessWorker(actor, worker)) return Error("Forbidden", StatusCodes.Status403Forbidden);
    sheet.Status = status;
    if (status is TimesheetStatus.APPROVED or TimesheetStatus.REJECTED)
    {
        sheet.ReviewedById = actor.Id;
        sheet.ReviewedAt = DateTime.UtcNow;
    }
    return Results.Ok(sheet);
}

static IEnumerable<T> FilterByActorWorkers<T>(User actor, InMemoryGlobalHireStore store, IEnumerable<T> items, Func<T, string> workerId)
{
    var visibleWorkers = actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST
        ? store.Workers.Select(worker => worker.Id).ToHashSet()
        : actor.Role == Role.WORKER
            ? new HashSet<string>(new[] { actor.WorkerId ?? "" })
            : store.Workers.Where(worker => worker.OrganizationId == actor.OrganizationId).Select(worker => worker.Id).ToHashSet();
    return items.Where(item => visibleWorkers.Contains(workerId(item)));
}

static User? CurrentUser(HttpContext context, InMemoryGlobalHireStore store)
{
    if (!context.Request.Cookies.TryGetValue("globalhire_user_id", out var id))
    {
        var bearer = context.Request.Headers.Authorization.ToString();
        if (bearer.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) id = bearer["Bearer ".Length..];
    }
    return id is null ? null : store.Users.FirstOrDefault(user => user.Id == id);
}

static bool CanAccessWorker(User actor, Worker worker)
{
    return actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST
        || (actor.Role == Role.WORKER && actor.WorkerId == worker.Id)
        || actor.OrganizationId == worker.OrganizationId;
}

static bool CanAccessOrganization(User actor, string organizationId)
{
    return actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST || actor.OrganizationId == organizationId;
}

static object PublicUser(User user) => new
{
    user.Id,
    user.Email,
    user.FirstName,
    user.LastName,
    user.Role,
    user.OrganizationId,
    user.WorkerId
};

static IResult Error(string message, int statusCode = StatusCodes.Status400BadRequest)
{
    return Results.Json(new { message }, statusCode: statusCode);
}
