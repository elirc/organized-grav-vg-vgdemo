using GlobalHireLite.Api.Domain;
using GlobalHireLite.Api.Infrastructure;

namespace GlobalHireLite.Api.Services;

public sealed class DashboardService(InMemoryGlobalHireStore store)
{
    public object Snapshot(User actor)
    {
        if (actor.Role == Role.WORKER && actor.WorkerId is not null)
        {
            var tasks = store.OnboardingTasks.Where(task => task.WorkerId == actor.WorkerId).ToList();
            var approvedRequired = tasks.Count(task => task.Required && task.Status == OnboardingTaskStatus.APPROVED);
            var required = Math.Max(1, tasks.Count(task => task.Required));
            var workerPayrollItems = store.PayrollItems.Where(item => item.WorkerId == actor.WorkerId).ToList();
            return new
            {
                onboardingProgress = decimal.Round(approvedRequired * 100m / required, 0),
                pendingTasks = tasks.Count(task => task.Required && task.Status != OnboardingTaskStatus.APPROVED),
                approvedLeaveDays = store.LeaveRequests.Count(leave => leave.WorkerId == actor.WorkerId && leave.Status == LeaveStatus.APPROVED),
                timesheetStatus = store.Timesheets.LastOrDefault(sheet => sheet.WorkerId == actor.WorkerId)?.Status.ToString() ?? "NONE",
                latestPayslipNetPay = workerPayrollItems.LastOrDefault()?.NetPay ?? 0
            };
        }

        var organizationId = actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST ? null : actor.OrganizationId;
        var workers = store.Workers.Where(worker => organizationId is null || worker.OrganizationId == organizationId).ToList();
        var workerIds = workers.Select(worker => worker.Id).ToHashSet();
        var payrollRuns = store.PayrollRuns.Where(run => organizationId is null || run.OrganizationId == organizationId).ToList();
        return new
        {
            activeWorkers = workers.Count(worker => worker.Status == WorkerStatus.ACTIVE),
            onboardingWorkers = workers.Count(worker => worker.Status == WorkerStatus.ONBOARDING),
            pendingLeaveRequests = store.LeaveRequests.Count(leave => workerIds.Contains(leave.WorkerId) && leave.Status == LeaveStatus.PENDING),
            pendingTimesheets = store.Timesheets.Count(sheet => workerIds.Contains(sheet.WorkerId) && sheet.Status == TimesheetStatus.SUBMITTED),
            currentPayrollTotal = payrollRuns.Sum(run => run.GrossTotal),
            openOffboardingCases = store.OffboardingCases.Count(item => workerIds.Contains(item.WorkerId) && item.Status is not OffboardingStatus.COMPLETED and not OffboardingStatus.CANCELLED),
            recentWorkers = workers.OrderByDescending(worker => worker.CreatedAt).Take(5),
            recentPayrollRuns = payrollRuns.OrderByDescending(run => run.CreatedAt).Take(5)
        };
    }
}
