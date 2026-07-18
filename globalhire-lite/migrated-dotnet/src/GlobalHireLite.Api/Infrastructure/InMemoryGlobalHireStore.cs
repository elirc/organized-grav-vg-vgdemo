using GlobalHireLite.Api.Domain;

namespace GlobalHireLite.Api.Infrastructure;

public sealed class InMemoryGlobalHireStore
{
    public List<User> Users { get; } = new();
    public List<Organization> Organizations { get; } = new();
    public List<Worker> Workers { get; } = new();
    public List<Employment> Employments { get; } = new();
    public List<CountryRule> CountryRules { get; } = new();
    public List<OnboardingTask> OnboardingTasks { get; } = new();
    public List<WorkerDocument> Documents { get; } = new();
    public List<LeaveRequest> LeaveRequests { get; } = new();
    public List<Timesheet> Timesheets { get; } = new();
    public List<PayrollRun> PayrollRuns { get; } = new();
    public List<PayrollItem> PayrollItems { get; } = new();
    public List<Invoice> Invoices { get; } = new();
    public List<OffboardingCase> OffboardingCases { get; } = new();
    public List<AuditLog> AuditLogs { get; } = new();

    public InMemoryGlobalHireStore()
    {
        var org = new Organization
        {
            Id = "org-acme",
            Name = "Acme Robotics",
            Industry = "Manufacturing",
            HeadquartersCountry = "US"
        };

        Organizations.Add(org);
        CountryRules.AddRange(new[]
        {
            new CountryRule
            {
                CountryCode = "US",
                CountryName = "United States",
                Currency = "USD",
                ProbationPeriodDays = 90,
                StatutoryVacationDays = 10,
                NoticePeriodDays = 14,
                RequiresTaxId = true,
                RequiresBankDetails = true,
                RequiresSignedContract = true,
                EmployerCostPercent = 0.12m,
                EmployeeTaxPercent = 0.22m
            },
            new CountryRule
            {
                CountryCode = "CA",
                CountryName = "Canada",
                Currency = "CAD",
                ProbationPeriodDays = 90,
                StatutoryVacationDays = 10,
                NoticePeriodDays = 14,
                RequiresTaxId = true,
                RequiresBankDetails = true,
                RequiresSignedContract = true,
                EmployerCostPercent = 0.14m,
                EmployeeTaxPercent = 0.2m
            }
        });

        var admin = new User
        {
            Id = "user-admin",
            Email = "admin@globalhire.test",
            FirstName = "Ada",
            LastName = "Admin",
            Role = Role.PLATFORM_ADMIN
        };
        var clientAdmin = new User
        {
            Id = "user-client",
            Email = "client@globalhire.test",
            FirstName = "Casey",
            LastName = "Client",
            Role = Role.CLIENT_ADMIN,
            OrganizationId = org.Id
        };

        Users.AddRange(new[] { admin, clientAdmin });

        var worker = new Worker
        {
            Id = "worker-maya",
            OrganizationId = org.Id,
            ManagerId = clientAdmin.Id,
            FirstName = "Maya",
            LastName = "Singh",
            Email = "maya.singh@example.com",
            CountryCode = "US",
            JobTitle = "Frontend Engineer",
            Department = "Product",
            EmploymentType = EmploymentType.FULL_TIME,
            Status = WorkerStatus.ACTIVE,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-6))
        };
        Workers.Add(worker);
        Employments.Add(new Employment
        {
            WorkerId = worker.Id,
            SalaryAmount = 9000,
            SalaryCurrency = "USD",
            EmploymentType = EmploymentType.FULL_TIME,
            StartDate = worker.StartDate,
            ContractStatus = ContractStatus.SIGNED
        });
        OnboardingTasks.AddRange(OnboardingTemplates(worker.Id, CountryRules[0]).Select(task =>
        {
            task.Status = OnboardingTaskStatus.APPROVED;
            task.ReviewedById = admin.Id;
            task.ReviewedAt = DateTime.UtcNow.AddMonths(-5);
            return task;
        }));
        Timesheets.Add(new Timesheet
        {
            WorkerId = worker.Id,
            WeekStartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-14)),
            RegularHours = 40,
            OvertimeHours = 4,
            Notes = "Launch support",
            Status = TimesheetStatus.APPROVED,
            ReviewedById = clientAdmin.Id,
            ReviewedAt = DateTime.UtcNow.AddDays(-7)
        });
    }

    public static IEnumerable<OnboardingTask> OnboardingTemplates(string workerId, CountryRule rule)
    {
        yield return new OnboardingTask { WorkerId = workerId, Title = "Personal information submitted", Description = "Confirm address, emergency contact, and personal details.", Category = OnboardingCategory.PERSONAL_INFO };
        yield return new OnboardingTask { WorkerId = workerId, Title = "Identity document uploaded", Description = "Upload passport, national ID, or other proof of identity metadata.", Category = OnboardingCategory.DOCUMENT };
        if (rule.RequiresSignedContract) yield return new OnboardingTask { WorkerId = workerId, Title = "Employment agreement signed", Description = "Confirm that the employment agreement has been signed.", Category = OnboardingCategory.CONTRACT };
        if (rule.RequiresTaxId) yield return new OnboardingTask { WorkerId = workerId, Title = "Tax information submitted", Description = "Provide local tax information needed for payroll setup.", Category = OnboardingCategory.TAX };
        yield return new OnboardingTask { WorkerId = workerId, Title = "Benefits selection completed", Description = "Select applicable demo benefits.", Category = OnboardingCategory.BENEFITS, Required = false };
        if (rule.RequiresBankDetails) yield return new OnboardingTask { WorkerId = workerId, Title = "Bank details submitted", Description = "Provide bank metadata for payroll setup.", Category = OnboardingCategory.BANK };
        yield return new OnboardingTask { WorkerId = workerId, Title = "Compliance review completed", Description = "EOR specialist review of onboarding readiness.", Category = OnboardingCategory.COMPLIANCE };
    }
}
