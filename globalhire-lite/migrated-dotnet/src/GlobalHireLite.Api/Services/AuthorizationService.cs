using GlobalHireLite.Api.Domain;

namespace GlobalHireLite.Api.Services;

public sealed class AuthorizationService
{
    public bool CanAccessOrganization(User actor, string organizationId)
    {
        return actor.Role is Role.PLATFORM_ADMIN or Role.EOR_SPECIALIST
            || actor.OrganizationId == organizationId;
    }

    public bool IsInRole(User actor, params Role[] roles) => roles.Contains(actor.Role);

    public IResult Forbidden() => Results.Json(new { message = "Forbidden" }, statusCode: StatusCodes.Status403Forbidden);
}
