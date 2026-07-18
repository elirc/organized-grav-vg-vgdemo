using GlobalHireLite.Api.Infrastructure;
using GlobalHireLite.Api.Services;

namespace GlobalHireLite.Api.Tests;

internal static class TestServices
{
    public static (InMemoryGlobalHireStore Store, WorkerService Workers) CreateWorkerServices()
    {
        var store = new InMemoryGlobalHireStore();
        var authorization = new AuthorizationService();
        return (store, new WorkerService(store, authorization));
    }

    public static (InMemoryGlobalHireStore Store, WorkerService Workers, PayrollService Payroll) CreatePayrollServices()
    {
        var store = new InMemoryGlobalHireStore();
        var authorization = new AuthorizationService();
        return (store, new WorkerService(store, authorization), new PayrollService(store, authorization));
    }
}
