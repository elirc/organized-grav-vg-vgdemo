namespace GlobalHireLite.Api.Domain;

public enum Role
{
    PLATFORM_ADMIN,
    EOR_SPECIALIST,
    CLIENT_ADMIN,
    CLIENT_MANAGER,
    WORKER
}

public enum OrganizationStatus { ACTIVE, SUSPENDED }
public enum WorkerStatus { DRAFT, ONBOARDING, ACTIVE, ON_LEAVE, OFFBOARDING, TERMINATED }
public enum EmploymentType { FULL_TIME, PART_TIME, CONTRACTOR }
public enum ContractStatus { DRAFT, SENT, SIGNED, CANCELLED }
public enum OnboardingCategory { PERSONAL_INFO, DOCUMENT, CONTRACT, TAX, BANK, BENEFITS, COMPLIANCE }
public enum OnboardingTaskStatus { NOT_STARTED, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED, BLOCKED }
public enum DocumentType { IDENTITY, CONTRACT, TAX_FORM, BANK_PROOF, OTHER }
public enum DocumentStatus { UPLOADED, APPROVED, REJECTED }
public enum LeaveType { VACATION, SICK, PERSONAL, PARENTAL }
public enum LeaveStatus { PENDING, APPROVED, REJECTED, CANCELLED }
public enum TimesheetStatus { DRAFT, SUBMITTED, APPROVED, REJECTED }
public enum PayrollRunStatus { DRAFT, CALCULATED, APPROVED, LOCKED }
public enum InvoiceStatus { DRAFT, ISSUED, PAID, VOID }
public enum OffboardingStatus { REQUESTED, IN_REVIEW, APPROVED, COMPLETED, CANCELLED }
