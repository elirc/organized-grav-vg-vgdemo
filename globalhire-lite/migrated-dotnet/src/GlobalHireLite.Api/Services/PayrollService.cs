using GlobalHireLite.Api.Contracts;
using GlobalHireLite.Api.Domain;
using GlobalHireLite.Api.Infrastructure;

namespace GlobalHireLite.Api.Services;

public sealed class PayrollService(InMemoryGlobalHireStore store, AuthorizationService authorization)
{
    public (PayrollRun? Run, string? Error) Create(User actor, CreatePayrollRunRequest input)
    {
        if (!authorization.CanAccessOrganization(actor, input.OrganizationId)) return (null, "Forbidden");
        if (input.PeriodEnd < input.PeriodStart) return (null, "periodEnd must be on or after periodStart");
        var duplicate = store.PayrollRuns.Any(run =>
            run.OrganizationId == input.OrganizationId &&
            run.PeriodStart == input.PeriodStart &&
            run.PeriodEnd == input.PeriodEnd &&
            run.Currency == input.Currency);
        if (duplicate) return (null, "Payroll run already exists for this organization, period, and currency");

        var run = new PayrollRun
        {
            OrganizationId = input.OrganizationId,
            PeriodStart = input.PeriodStart,
            PeriodEnd = input.PeriodEnd,
            Currency = input.Currency,
            CreatedById = actor.Id
        };
        store.PayrollRuns.Add(run);
        return (run, null);
    }

    public (object? Run, string? Error) Calculate(User actor, string id)
    {
        var run = store.PayrollRuns.FirstOrDefault(candidate => candidate.Id == id);
        if (run is null) return (null, "Payroll run not found");
        if (!authorization.CanAccessOrganization(actor, run.OrganizationId)) return (null, "Forbidden");
        if (run.Status != PayrollRunStatus.DRAFT) return (null, "Payroll can only be calculated from DRAFT");

        var workers = store.Workers.Where(worker => worker.OrganizationId == run.OrganizationId && worker.Status == WorkerStatus.ACTIVE).ToList();
        if (workers.Count == 0) return (null, "Payroll requires at least one ACTIVE worker");

        var items = new List<PayrollItem>();
        foreach (var worker in workers)
        {
            var employment = store.Employments.FirstOrDefault(candidate => candidate.WorkerId == worker.Id);
            if (employment is null) return (null, $"Worker {worker.Email} is missing employment terms");
            var rule = store.CountryRules.FirstOrDefault(candidate => candidate.CountryCode == worker.CountryCode);
            if (rule is null) return (null, $"Missing country rule for {worker.CountryCode}");

            var overtimeHours = store.Timesheets
                .Where(sheet => sheet.WorkerId == worker.Id && sheet.Status == TimesheetStatus.APPROVED && sheet.WeekStartDate >= run.PeriodStart && sheet.WeekStartDate <= run.PeriodEnd)
                .Sum(sheet => sheet.OvertimeHours);
            var hourlyRate = employment.SalaryAmount / 160m;
            var overtimePay = overtimeHours * hourlyRate * 1.5m;
            var grossPay = employment.SalaryAmount + overtimePay;
            var employeeTax = grossPay * rule.EmployeeTaxPercent;
            var employerCost = grossPay * rule.EmployerCostPercent;
            items.Add(new PayrollItem
            {
                PayrollRunId = run.Id,
                WorkerId = worker.Id,
                GrossPay = decimal.Round(grossPay, 2),
                OvertimePay = decimal.Round(overtimePay, 2),
                EmployeeTax = decimal.Round(employeeTax, 2),
                EmployerCost = decimal.Round(employerCost, 2),
                NetPay = decimal.Round(grossPay - employeeTax, 2),
                Currency = run.Currency
            });
        }

        store.PayrollItems.RemoveAll(item => item.PayrollRunId == id);
        store.PayrollItems.AddRange(items);
        run.GrossTotal = items.Sum(item => item.GrossPay);
        run.EmployeeTaxTotal = items.Sum(item => item.EmployeeTax);
        run.EmployerCostTotal = items.Sum(item => item.EmployerCost);
        run.NetTotal = items.Sum(item => item.NetPay);
        run.Status = PayrollRunStatus.CALCULATED;
        store.AuditLogs.Add(new AuditLog { OrganizationId = run.OrganizationId, ActorUserId = actor.Id, EntityType = "PayrollRun", EntityId = id, Action = "PAYROLL_CALCULATED", Message = "Payroll run calculated" });
        return (WithItems(run), null);
    }

    public (PayrollRun? Run, string? Error) Approve(User actor, string id)
    {
        var run = store.PayrollRuns.FirstOrDefault(candidate => candidate.Id == id);
        if (run is null) return (null, "Payroll run not found");
        if (!authorization.CanAccessOrganization(actor, run.OrganizationId)) return (null, "Forbidden");
        if (run.Status != PayrollRunStatus.CALCULATED) return (null, "Payroll must be CALCULATED before approval");
        if (run.GrossTotal <= 0) return (null, "Payroll cannot be approved with zero gross total");
        run.Status = PayrollRunStatus.APPROVED;
        run.ApprovedById = actor.Id;
        run.ApprovedAt = DateTime.UtcNow;
        store.AuditLogs.Add(new AuditLog { OrganizationId = run.OrganizationId, ActorUserId = actor.Id, EntityType = "PayrollRun", EntityId = id, Action = "PAYROLL_APPROVED", Message = "Payroll run approved" });
        return (run, null);
    }

    public (PayrollRun? Run, string? Error) Lock(User actor, string id)
    {
        var run = store.PayrollRuns.FirstOrDefault(candidate => candidate.Id == id);
        if (run is null) return (null, "Payroll run not found");
        if (!authorization.CanAccessOrganization(actor, run.OrganizationId)) return (null, "Forbidden");
        if (run.Status != PayrollRunStatus.APPROVED) return (null, "Payroll must be APPROVED before lock");
        run.Status = PayrollRunStatus.LOCKED;
        run.LockedAt = DateTime.UtcNow;
        return (run, null);
    }

    public object WithItems(PayrollRun run) => new
    {
        run,
        items = store.PayrollItems.Where(item => item.PayrollRunId == run.Id).Select(item => new
        {
            item,
            worker = store.Workers.FirstOrDefault(worker => worker.Id == item.WorkerId)
        })
    };
}
