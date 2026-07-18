using GlobalHireLite.Api.Domain;

namespace GlobalHireLite.Api.Contracts;

public sealed record LoginRequest(string Email, string Password);

public sealed record CreateWorkerRequest(
    string FirstName,
    string LastName,
    string Email,
    string CountryCode,
    string JobTitle,
    string Department,
    EmploymentType EmploymentType,
    DateOnly StartDate,
    decimal SalaryAmount,
    string SalaryCurrency,
    string? ManagerId,
    string? OrganizationId);

public sealed record UpdateWorkerRequest(
    string? JobTitle,
    string? Department,
    string? ManagerId,
    WorkerStatus? Status,
    decimal? SalaryAmount,
    string? SalaryCurrency,
    ContractStatus? ContractStatus);

public sealed record CreatePayrollRunRequest(string OrganizationId, DateOnly PeriodStart, DateOnly PeriodEnd, string Currency);
public sealed record CreateLeaveRequest(string? WorkerId, LeaveType LeaveType, DateOnly StartDate, DateOnly EndDate, string Reason);
public sealed record CreateTimesheetRequest(string? WorkerId, DateOnly WeekStartDate, decimal RegularHours, decimal OvertimeHours, string? Notes);
public sealed record CreateDocumentRequest(string FileName, DocumentType DocumentType);
public sealed record RejectRequest(string RejectionReason);
public sealed record CreateOffboardingRequest(string WorkerId, string Reason, DateOnly LastWorkingDay, string? Notes);
