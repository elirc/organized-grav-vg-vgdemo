using GlobalHireLite.Api.Contracts;
using GlobalHireLite.Api.Domain;
using GlobalHireLite.Api.Infrastructure;
using GlobalHireLite.Api.Services;
using Xunit;

namespace GlobalHireLite.Api.Tests;

public sealed class WorkerServiceTests
{
    [Fact]
    public void ActivateRejectsWorkerWithIncompleteRequiredOnboardingTasks()
    {
        var (store, workers) = TestServices.CreateWorkerServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var (created, createError) = workers.Create(actor, NewWorker());

        Assert.Null(createError);

        var (_, activationError) = workers.Activate(actor, created!.Id);

        Assert.Equal("All required onboarding tasks must be approved before activation", activationError);
        Assert.Equal(WorkerStatus.ONBOARDING, created.Status);
    }

    [Fact]
    public void ActivateRejectsWorkerWithoutSignedContract()
    {
        var (store, workers) = TestServices.CreateWorkerServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var (created, _) = workers.Create(actor, NewWorker());

        foreach (var task in store.OnboardingTasks.Where(task => task.WorkerId == created!.Id))
        {
            task.Status = OnboardingTaskStatus.APPROVED;
        }

        var (_, activationError) = workers.Activate(actor, created!.Id);

        Assert.Equal("Employment contract must be SIGNED before activation", activationError);
        Assert.Equal(WorkerStatus.ONBOARDING, created.Status);
    }

    [Fact]
    public void ActivateSucceedsWhenRequiredTasksAreApprovedAndContractIsSigned()
    {
        var (store, workers) = TestServices.CreateWorkerServices();
        var actor = store.Users.First(user => user.Id == "user-admin");
        var (created, _) = workers.Create(actor, NewWorker());

        foreach (var task in store.OnboardingTasks.Where(task => task.WorkerId == created!.Id))
        {
            task.Status = OnboardingTaskStatus.APPROVED;
        }

        store.Employments.First(employment => employment.WorkerId == created!.Id).ContractStatus = ContractStatus.SIGNED;

        var (_, activationError) = workers.Activate(actor, created!.Id);

        Assert.Null(activationError);
        Assert.Equal(WorkerStatus.ACTIVE, created.Status);
        Assert.Contains(store.AuditLogs, log => log.EntityId == created.Id && log.Action == "WORKER_ACTIVATED");
    }

    [Fact]
    public void ClientAdminListIsScopedToTheirOrganization()
    {
        var (store, workers) = TestServices.CreateWorkerServices();
        var client = store.Users.First(user => user.Id == "user-client");
        store.Organizations.Add(new Organization { Id = "org-other", Name = "Other Org", Industry = "Tech", HeadquartersCountry = "CA" });
        store.Workers.Add(new Worker
        {
            Id = "worker-other",
            OrganizationId = "org-other",
            FirstName = "Other",
            LastName = "Worker",
            Email = "other@example.com",
            CountryCode = "CA",
            JobTitle = "Engineer",
            Department = "Product",
            EmploymentType = EmploymentType.FULL_TIME,
            StartDate = new DateOnly(2026, 1, 1)
        });

        var visibleWorkers = workers.List(client, null, null, null, null).ToList();

        Assert.Single(visibleWorkers);
    }

    private static CreateWorkerRequest NewWorker() => new(
        FirstName: "Jordan",
        LastName: "Lee",
        Email: "jordan.lee@example.com",
        CountryCode: "US",
        JobTitle: "Backend Engineer",
        Department: "Engineering",
        EmploymentType: EmploymentType.FULL_TIME,
        StartDate: new DateOnly(2026, 6, 1),
        SalaryAmount: 8_000m,
        SalaryCurrency: "USD",
        ManagerId: null,
        OrganizationId: "org-acme");
}
