using GlobalHireLite.Api.Contracts;
using GlobalHireLite.Api.Domain;
using GlobalHireLite.Api.Infrastructure;
using GlobalHireLite.Api.Services;
using Xunit;

namespace GlobalHireLite.Api.Tests;

public sealed class PayrollServiceTests
{
    [Fact]
    public void CreateRejectsPeriodEndBeforePeriodStart()
    {
        var (store, _, payroll) = TestServices.CreatePayrollServices();
        var actor = store.Users.First(user => user.Id == "user-admin");

        var (_, error) = payroll.Create(actor, new CreatePayrollRunRequest(
            OrganizationId: "org-acme",
            PeriodStart: new DateOnly(2026, 6, 30),
            PeriodEnd: new DateOnly(2026, 6, 1),
            Currency: "USD"));

        Assert.Equal("periodEnd must be on or after periodStart", error);
    }

    [Fact]
    public void CreateRejectsDuplicatePayrollRunForOrganizationPeriodAndCurrency()
    {
        var (store, _, payroll) = TestServices.CreatePayrollServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var request = new CreatePayrollRunRequest("org-acme", new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30), "USD");

        var (_, firstError) = payroll.Create(actor, request);
        var (_, duplicateError) = payroll.Create(actor, request);

        Assert.Null(firstError);
        Assert.Equal("Payroll run already exists for this organization, period, and currency", duplicateError);
    }

    [Fact]
    public void CalculateIncludesOnlyActiveWorkersAndApprovedTimesheetsInThePayrollPeriod()
    {
        var (store, _, payroll) = TestServices.CreatePayrollServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var approvedSheet = store.Timesheets.Single();
        AddInactiveWorkerWithApprovedTimesheet(store, approvedSheet.WeekStartDate);
        store.Timesheets.Add(new Timesheet
        {
            WorkerId = "worker-maya",
            WeekStartDate = approvedSheet.WeekStartDate,
            RegularHours = 40m,
            OvertimeHours = 10m,
            Status = TimesheetStatus.SUBMITTED
        });
        var request = new CreatePayrollRunRequest(
            OrganizationId: "org-acme",
            PeriodStart: approvedSheet.WeekStartDate.AddDays(-1),
            PeriodEnd: approvedSheet.WeekStartDate.AddDays(1),
            Currency: "USD");
        var (run, createError) = payroll.Create(actor, request);

        var (_, calculateError) = payroll.Calculate(actor, run!.Id);

        Assert.Null(createError);
        Assert.Null(calculateError);
        Assert.Equal(PayrollRunStatus.CALCULATED, run.Status);
        Assert.Single(store.PayrollItems.Where(item => item.PayrollRunId == run.Id));

        var item = store.PayrollItems.Single(item => item.PayrollRunId == run.Id);
        Assert.Equal("worker-maya", item.WorkerId);
        Assert.Equal(337.50m, item.OvertimePay);
        Assert.Equal(9_337.50m, item.GrossPay);
        Assert.Equal(2_054.25m, item.EmployeeTax);
        Assert.Equal(1_120.50m, item.EmployerCost);
        Assert.Equal(7_283.25m, item.NetPay);
        Assert.Contains(store.AuditLogs, log => log.EntityId == run.Id && log.Action == "PAYROLL_CALCULATED");
    }

    [Fact]
    public void ApproveRejectsPayrollBeforeCalculation()
    {
        var (store, _, payroll) = TestServices.CreatePayrollServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var (run, _) = payroll.Create(actor, new CreatePayrollRunRequest(
            "org-acme",
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 6, 30),
            "USD"));

        var (_, error) = payroll.Approve(actor, run!.Id);

        Assert.Equal("Payroll must be CALCULATED before approval", error);
    }

    [Fact]
    public void LockRejectsPayrollBeforeApproval()
    {
        var (store, _, payroll) = TestServices.CreatePayrollServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var approvedSheet = store.Timesheets.Single();
        var (run, _) = payroll.Create(actor, new CreatePayrollRunRequest(
            "org-acme",
            approvedSheet.WeekStartDate.AddDays(-1),
            approvedSheet.WeekStartDate.AddDays(1),
            "USD"));
        payroll.Calculate(actor, run!.Id);

        var (_, error) = payroll.Lock(actor, run.Id);

        Assert.Equal("Payroll must be APPROVED before lock", error);
    }

    [Fact]
    public void ApproveThenLockTransitionsPayrollToLocked()
    {
        var (store, _, payroll) = TestServices.CreatePayrollServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var approvedSheet = store.Timesheets.Single();
        var (run, _) = payroll.Create(actor, new CreatePayrollRunRequest(
            "org-acme",
            approvedSheet.WeekStartDate.AddDays(-1),
            approvedSheet.WeekStartDate.AddDays(1),
            "USD"));

        payroll.Calculate(actor, run!.Id);
        var (_, approveError) = payroll.Approve(actor, run.Id);
        var (_, lockError) = payroll.Lock(actor, run.Id);

        Assert.Null(approveError);
        Assert.Null(lockError);
        Assert.Equal(PayrollRunStatus.LOCKED, run.Status);
        Assert.NotNull(run.ApprovedAt);
        Assert.NotNull(run.LockedAt);
    }

    private static void AddInactiveWorkerWithApprovedTimesheet(InMemoryGlobalHireStore store, DateOnly sheetDate)
    {
        store.Workers.Add(new Worker
        {
            Id = "worker-inactive",
            OrganizationId = "org-acme",
            FirstName = "Inactive",
            LastName = "Worker",
            Email = "inactive@example.com",
            CountryCode = "US",
            JobTitle = "Designer",
            Department = "Product",
            EmploymentType = EmploymentType.FULL_TIME,
            Status = WorkerStatus.ONBOARDING,
            StartDate = new DateOnly(2026, 1, 1)
        });
        store.Employments.Add(new Employment
        {
            WorkerId = "worker-inactive",
            SalaryAmount = 10_000m,
            SalaryCurrency = "USD",
            EmploymentType = EmploymentType.FULL_TIME,
            StartDate = new DateOnly(2026, 1, 1),
            ContractStatus = ContractStatus.SIGNED
        });
        store.Timesheets.Add(new Timesheet
        {
            WorkerId = "worker-inactive",
            WeekStartDate = sheetDate,
            RegularHours = 40m,
            OvertimeHours = 20m,
            Status = TimesheetStatus.APPROVED
        });
    }
}
