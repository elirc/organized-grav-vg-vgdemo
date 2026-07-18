using GlobalHireLite.Api.Contracts;
using GlobalHireLite.Api.Domain;
using GlobalHireLite.Api.Infrastructure;

namespace GlobalHireLite.Api.Services;

public sealed class WorkerService(InMemoryGlobalHireStore store, AuthorizationService authorization)
{
    public IEnumerable<object> List(User actor, string? search, WorkerStatus? status, string? country, string? department)
    {
        return QueryForActor(actor)
            .Where(worker => status is null || worker.Status == status)
            .Where(worker => country is null || worker.CountryCode.Equals(country, StringComparison.OrdinalIgnoreCase))
            .Where(worker => department is null || worker.Department.Equals(department, StringComparison.OrdinalIgnoreCase))
            .Where(worker => string.IsNullOrWhiteSpace(search) ||
                worker.FirstName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                worker.LastName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                worker.Email.Contains(search, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(worker => worker.CreatedAt)
            .Select(WithDetails);
    }

    public object? Get(User actor, string id)
    {
        var worker = store.Workers.FirstOrDefault(candidate => candidate.Id == id);
        if (worker is null) return null;
        if (actor.Role == Role.WORKER && actor.WorkerId != worker.Id) return null;
        if (!authorization.CanAccessOrganization(actor, worker.OrganizationId)) return null;
        return WithDetails(worker);
    }

    public (Worker? Worker, string? Error) Create(User actor, CreateWorkerRequest input)
    {
        var organizationId = actor.Role == Role.CLIENT_ADMIN
            ? actor.OrganizationId
            : input.OrganizationId ?? actor.OrganizationId;
        if (organizationId is null) return (null, "organizationId is required");
        if (actor.Role == Role.CLIENT_ADMIN && organizationId != actor.OrganizationId) return (null, "Client admins can only create workers in their organization");

        var rule = store.CountryRules.FirstOrDefault(candidate => candidate.CountryCode == input.CountryCode);
        if (rule is null) return (null, "Country rule not found for worker country");

        var worker = new Worker
        {
            OrganizationId = organizationId,
            ManagerId = input.ManagerId,
            FirstName = input.FirstName,
            LastName = input.LastName,
            Email = input.Email,
            CountryCode = input.CountryCode,
            JobTitle = input.JobTitle,
            Department = input.Department,
            EmploymentType = input.EmploymentType,
            Status = WorkerStatus.ONBOARDING,
            StartDate = input.StartDate
        };
        store.Workers.Add(worker);
        store.Employments.Add(new Employment
        {
            WorkerId = worker.Id,
            SalaryAmount = input.SalaryAmount,
            SalaryCurrency = input.SalaryCurrency,
            EmploymentType = input.EmploymentType,
            StartDate = input.StartDate
        });
        store.OnboardingTasks.AddRange(InMemoryGlobalHireStore.OnboardingTemplates(worker.Id, rule));
        Audit(actor, organizationId, "Worker", worker.Id, "WORKER_CREATED", $"Worker {worker.FirstName} {worker.LastName} was created");
        return (worker, null);
    }

    public (object? Worker, string? Error) Update(User actor, string id, UpdateWorkerRequest input)
    {
        var worker = store.Workers.FirstOrDefault(candidate => candidate.Id == id);
        if (worker is null) return (null, "Worker not found");
        if (!authorization.CanAccessOrganization(actor, worker.OrganizationId)) return (null, "Forbidden");

        if (!string.IsNullOrWhiteSpace(input.JobTitle)) worker.JobTitle = input.JobTitle;
        if (!string.IsNullOrWhiteSpace(input.Department)) worker.Department = input.Department;
        if (input.ManagerId is not null) worker.ManagerId = input.ManagerId;
        if (input.Status is not null) worker.Status = input.Status.Value;

        var employment = store.Employments.FirstOrDefault(candidate => candidate.WorkerId == id);
        if (employment is not null)
        {
            if (input.SalaryAmount is not null) employment.SalaryAmount = input.SalaryAmount.Value;
            if (!string.IsNullOrWhiteSpace(input.SalaryCurrency)) employment.SalaryCurrency = input.SalaryCurrency;
            if (input.ContractStatus is not null) employment.ContractStatus = input.ContractStatus.Value;
        }

        return (WithDetails(worker), null);
    }

    public (object? Worker, string? Error) Activate(User actor, string id)
    {
        var worker = store.Workers.FirstOrDefault(candidate => candidate.Id == id);
        if (worker is null) return (null, "Worker not found");
        if (!authorization.CanAccessOrganization(actor, worker.OrganizationId)) return (null, "Forbidden");
        if (worker.Status != WorkerStatus.ONBOARDING) return (null, "Only workers in ONBOARDING status can be activated");

        var incomplete = store.OnboardingTasks.Any(task => task.WorkerId == id && task.Required && task.Status != OnboardingTaskStatus.APPROVED);
        if (incomplete) return (null, "All required onboarding tasks must be approved before activation");

        var employment = store.Employments.FirstOrDefault(candidate => candidate.WorkerId == id);
        if (employment?.ContractStatus != ContractStatus.SIGNED) return (null, "Employment contract must be SIGNED before activation");

        worker.Status = WorkerStatus.ACTIVE;
        Audit(actor, worker.OrganizationId, "Worker", worker.Id, "WORKER_ACTIVATED", "Worker activated after onboarding completion");
        return (WithDetails(worker), null);
    }

    private IEnumerable<Worker> QueryForActor(User actor)
    {
        if (actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST) return store.Workers;
        if (actor.Role == Role.WORKER) return store.Workers.Where(worker => worker.Id == actor.WorkerId);
        return store.Workers.Where(worker => worker.OrganizationId == actor.OrganizationId);
    }

    private object WithDetails(Worker worker) => new
    {
        worker,
        organization = store.Organizations.FirstOrDefault(org => org.Id == worker.OrganizationId),
        employment = store.Employments.FirstOrDefault(employment => employment.WorkerId == worker.Id),
        onboardingTasks = store.OnboardingTasks.Where(task => task.WorkerId == worker.Id),
        documents = store.Documents.Where(document => document.WorkerId == worker.Id),
        leaveRequests = store.LeaveRequests.Where(leave => leave.WorkerId == worker.Id).OrderByDescending(leave => leave.CreatedAt),
        timesheets = store.Timesheets.Where(sheet => sheet.WorkerId == worker.Id).OrderByDescending(sheet => sheet.WeekStartDate),
        payrollItems = store.PayrollItems.Where(item => item.WorkerId == worker.Id),
        offboardingCases = store.OffboardingCases.Where(caseItem => caseItem.WorkerId == worker.Id),
        countryRule = store.CountryRules.FirstOrDefault(rule => rule.CountryCode == worker.CountryCode)
    };

    private void Audit(User actor, string? organizationId, string entityType, string entityId, string action, string message)
    {
        store.AuditLogs.Add(new AuditLog
        {
            OrganizationId = organizationId,
            ActorUserId = actor.Id,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Message = message
        });
    }
}
