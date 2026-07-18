namespace GlobalHireLite.Api.Domain;

public sealed record User
{
    public string Id { get; init; } = Ids.New();
    public string Email { get; init; } = "";
    public string Password { get; init; } = "password123";
    public string FirstName { get; init; } = "";
    public string LastName { get; init; } = "";
    public Role Role { get; init; }
    public string? OrganizationId { get; init; }
    public string? WorkerId { get; set; }
}

public sealed record Organization
{
    public string Id { get; init; } = Ids.New();
    public string Name { get; init; } = "";
    public string Industry { get; init; } = "";
    public string HeadquartersCountry { get; init; } = "";
    public OrganizationStatus Status { get; set; } = OrganizationStatus.ACTIVE;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public sealed record Worker
{
    public string Id { get; init; } = Ids.New();
    public string OrganizationId { get; init; } = "";
    public string? UserId { get; set; }
    public string? ManagerId { get; set; }
    public string FirstName { get; init; } = "";
    public string LastName { get; init; } = "";
    public string Email { get; init; } = "";
    public string CountryCode { get; init; } = "";
    public string JobTitle { get; set; } = "";
    public string Department { get; set; } = "";
    public EmploymentType EmploymentType { get; init; }
    public WorkerStatus Status { get; set; } = WorkerStatus.ONBOARDING;
    public DateOnly StartDate { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public sealed record Employment
{
    public string Id { get; init; } = Ids.New();
    public string WorkerId { get; init; } = "";
    public decimal SalaryAmount { get; set; }
    public string SalaryCurrency { get; set; } = "USD";
    public EmploymentType EmploymentType { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly? EndDate { get; set; }
    public ContractStatus ContractStatus { get; set; } = ContractStatus.DRAFT;
}

public sealed record CountryRule
{
    public string Id { get; init; } = Ids.New();
    public string CountryCode { get; init; } = "";
    public string CountryName { get; init; } = "";
    public string Currency { get; init; } = "";
    public int ProbationPeriodDays { get; init; }
    public int StatutoryVacationDays { get; init; }
    public int NoticePeriodDays { get; init; }
    public bool RequiresTaxId { get; init; }
    public bool RequiresBankDetails { get; init; }
    public bool RequiresSignedContract { get; init; }
    public decimal EmployerCostPercent { get; init; }
    public decimal EmployeeTaxPercent { get; init; }
}

public sealed record OnboardingTask
{
    public string Id { get; init; } = Ids.New();
    public string WorkerId { get; init; } = "";
    public string Title { get; init; } = "";
    public string Description { get; init; } = "";
    public OnboardingCategory Category { get; init; }
    public bool Required { get; init; } = true;
    public OnboardingTaskStatus Status { get; set; } = OnboardingTaskStatus.NOT_STARTED;
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedById { get; set; }
    public string? RejectionReason { get; set; }
}

public sealed record WorkerDocument
{
    public string Id { get; init; } = Ids.New();
    public string WorkerId { get; init; } = "";
    public string UploadedById { get; init; } = "";
    public string FileName { get; init; } = "";
    public DocumentType DocumentType { get; init; }
    public DocumentStatus Status { get; set; } = DocumentStatus.UPLOADED;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public sealed record LeaveRequest
{
    public string Id { get; init; } = Ids.New();
    public string WorkerId { get; init; } = "";
    public LeaveType LeaveType { get; init; }
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public string Reason { get; init; } = "";
    public LeaveStatus Status { get; set; } = LeaveStatus.PENDING;
    public string? ReviewedById { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public sealed record Timesheet
{
    public string Id { get; init; } = Ids.New();
    public string WorkerId { get; init; } = "";
    public DateOnly WeekStartDate { get; init; }
    public decimal RegularHours { get; init; }
    public decimal OvertimeHours { get; init; }
    public string Notes { get; init; } = "";
    public TimesheetStatus Status { get; set; } = TimesheetStatus.DRAFT;
    public string? ReviewedById { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

public sealed record PayrollRun
{
    public string Id { get; init; } = Ids.New();
    public string OrganizationId { get; init; } = "";
    public DateOnly PeriodStart { get; init; }
    public DateOnly PeriodEnd { get; init; }
    public PayrollRunStatus Status { get; set; } = PayrollRunStatus.DRAFT;
    public string Currency { get; init; } = "USD";
    public decimal GrossTotal { get; set; }
    public decimal EmployeeTaxTotal { get; set; }
    public decimal EmployerCostTotal { get; set; }
    public decimal NetTotal { get; set; }
    public string CreatedById { get; init; } = "";
    public string? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? LockedAt { get; set; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public sealed record PayrollItem
{
    public string Id { get; init; } = Ids.New();
    public string PayrollRunId { get; init; } = "";
    public string WorkerId { get; init; } = "";
    public decimal GrossPay { get; init; }
    public decimal OvertimePay { get; init; }
    public decimal EmployeeTax { get; init; }
    public decimal EmployerCost { get; init; }
    public decimal NetPay { get; init; }
    public string Currency { get; init; } = "USD";
}

public sealed record Invoice
{
    public string Id { get; init; } = Ids.New();
    public string OrganizationId { get; init; } = "";
    public string PayrollRunId { get; init; } = "";
    public string InvoiceNumber { get; init; } = "";
    public decimal Subtotal { get; init; }
    public decimal PlatformFee { get; init; }
    public decimal Total { get; init; }
    public string Currency { get; init; } = "USD";
    public InvoiceStatus Status { get; set; } = InvoiceStatus.DRAFT;
    public DateOnly DueDate { get; init; }
}

public sealed record OffboardingCase
{
    public string Id { get; init; } = Ids.New();
    public string WorkerId { get; init; } = "";
    public string RequestedById { get; init; } = "";
    public string Reason { get; init; } = "";
    public DateOnly LastWorkingDay { get; init; }
    public OffboardingStatus Status { get; set; } = OffboardingStatus.REQUESTED;
    public string? Notes { get; set; }
}

public sealed record AuditLog
{
    public string Id { get; init; } = Ids.New();
    public string? OrganizationId { get; init; }
    public string? ActorUserId { get; init; }
    public string EntityType { get; init; } = "";
    public string EntityId { get; init; } = "";
    public string Action { get; init; } = "";
    public string Message { get; init; } = "";
    public object? Metadata { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public static class Ids
{
    public static string New() => Guid.NewGuid().ToString("n");
}
