import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { User, api } from './api';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="centered">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={setUser} />} />
      <Route element={user ? <Shell user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/workers/:id" element={<WorkerDetailPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('admin@globalhire.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result = await api.login(email, password);
      onLogin(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="login">
      <form className="login-panel" onSubmit={submit}>
        <div>
          <p className="eyebrow">GlobalHire Lite</p>
          <h1>Operations console</h1>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary">Sign in</button>
      </form>
    </main>
  );
}

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const navigate = useNavigate();
  const links = [
    ['/dashboard', 'Dashboard'],
    ['/workers', 'Workers'],
    ['/payroll', 'Payroll'],
    ['/resources', 'Resources'],
  ] as const;

  async function logout() {
    await api.logout();
    onLogout();
    navigate('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span>GlobalHire</span>
        </div>
        <nav>
          {links.map(([href, label]) => (
            <Link to={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <strong>{user.firstName} {user.lastName}</strong>
            <span>{user.role.replace(/_/g, ' ')}</span>
          </div>
          <button className="icon-button" aria-label="Sign out" onClick={logout}>
            X
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}

function DashboardPage() {
  const { data, error } = useLoad(api.dashboard);
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <p>Loading dashboard...</p>;

  const stats = [
    ['Active workers', data.activeWorkers],
    ['Onboarding', data.onboardingWorkers],
    ['Pending leave', data.pendingLeaveRequests],
    ['Pending timesheets', data.pendingTimesheets],
    ['Payroll estimate', currency.format(data.currentPayrollTotal ?? 0)],
    ['Open offboarding', data.openOffboardingCases],
  ];

  return (
    <div className="stack">
      <PageTitle title="Operations dashboard" subtitle="Workforce, approvals, payroll, and offboarding at a glance." />
      <div className="stats">
        {stats.map(([label, value]) => <Stat key={label} label={label} value={value} />)}
      </div>
      <div className="two-column">
        <Panel title="Recent workers">
          <DataTable columns={['Name', 'Status', 'Start']} rows={(data.recentWorkers ?? []).map((worker: any) => [
            <Link to={`/workers/${worker.id}`}>{worker.firstName} {worker.lastName}</Link>,
            <Badge value={worker.status} />,
            worker.startDate,
          ])} />
        </Panel>
        <Panel title="Recent payroll runs">
          <DataTable columns={['Period', 'Status', 'Gross']} rows={(data.recentPayrollRuns ?? []).map((run: any) => [
            `${run.periodStart} - ${run.periodEnd}`,
            <Badge value={run.status} />,
            currency.format(run.grossTotal ?? 0),
          ])} />
        </Panel>
      </div>
    </div>
  );
}

function WorkersPage() {
  const { data, error, reload } = useLoad(api.workers);
  if (error) return <ErrorMessage error={error} />;
  return (
    <div className="stack">
      <PageTitle title="Workers" subtitle="Employee records, onboarding progress, country rules, and employment terms." />
      <Panel title="Directory">
        <DataTable columns={['Name', 'Role', 'Country', 'Status', 'Action']} rows={(data ?? []).map((entry: any) => {
          const worker = entry.worker ?? entry;
          return [
            <Link to={`/workers/${worker.id}`}>{worker.firstName} {worker.lastName}</Link>,
            worker.jobTitle,
            worker.countryCode,
            <Badge value={worker.status} />,
            <button className="ghost" onClick={async () => { await api.activateWorker(worker.id).catch(() => undefined); reload(); }}>Activate</button>,
          ];
        })} />
      </Panel>
    </div>
  );
}

function WorkerDetailPage() {
  const { id } = useParams();
  const { data, error } = useLoad(() => api.worker(id!), [id]);
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <p>Loading worker...</p>;
  const worker = data.worker;
  return (
    <div className="stack">
      <PageTitle title={`${worker.firstName} ${worker.lastName}`} subtitle={`${worker.jobTitle} in ${worker.department}`} />
      <div className="stats">
        <Stat label="Status" value={worker.status} />
        <Stat label="Country" value={worker.countryCode} />
        <Stat label="Salary" value={currency.format(data.employment?.salaryAmount ?? 0)} />
        <Stat label="Contract" value={data.employment?.contractStatus ?? 'DRAFT'} />
      </div>
      <Panel title="Onboarding tasks">
        <DataTable columns={['Task', 'Category', 'Required', 'Status']} rows={(data.onboardingTasks ?? []).map((task: any) => [
          task.title,
          task.category,
          task.required ? 'Yes' : 'No',
          <Badge value={task.status} />,
        ])} />
      </Panel>
    </div>
  );
}

function PayrollPage() {
  const { data, error, reload } = useLoad(api.payrollRuns);
  const [organizationId, setOrganizationId] = useState('org-acme');
  if (error) return <ErrorMessage error={error} />;

  async function createRun(event: FormEvent) {
    event.preventDefault();
    await api.createPayrollRun({
      organizationId,
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
      currency: 'USD',
    });
    reload();
  }

  return (
    <div className="stack">
      <PageTitle title="Payroll" subtitle="Create, calculate, approve, and lock payroll runs." />
      <form className="toolbar" onSubmit={createRun}>
        <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} aria-label="Organization id" />
        <button className="primary">Create June run</button>
      </form>
      <Panel title="Payroll runs">
        <DataTable columns={['Period', 'Status', 'Gross', 'Net', 'Actions']} rows={(data ?? []).map((entry: any) => {
          const run = entry.run ?? entry;
          return [
            `${run.periodStart} - ${run.periodEnd}`,
            <Badge value={run.status} />,
            currency.format(run.grossTotal ?? 0),
            currency.format(run.netTotal ?? 0),
            <div className="row-actions">
              <button className="ghost" onClick={async () => { await api.calculatePayroll(run.id); reload(); }}>Calculate</button>
              <button className="ghost" onClick={async () => { await api.approvePayroll(run.id); reload(); }}>Approve</button>
              <button className="ghost" onClick={async () => { await api.lockPayroll(run.id); reload(); }}>Lock</button>
            </div>,
          ];
        })} />
      </Panel>
    </div>
  );
}

function ResourcesPage() {
  const countryRules = useLoad(api.countryRules);
  const invoices = useLoad(api.invoices);
  const leave = useLoad(api.leaveRequests);
  const timesheets = useLoad(api.timesheets);
  const offboarding = useLoad(api.offboardingCases);
  const audit = useLoad(api.auditLog);

  return (
    <div className="stack">
      <PageTitle title="Resources" subtitle="Compliance rules and operational records from the migrated API." />
      <div className="two-column">
        <Panel title="Country rules">
          <DataTable columns={['Country', 'Currency', 'Employer cost', 'Employee tax']} rows={(countryRules.data ?? []).map((rule: any) => [
            `${rule.countryName} (${rule.countryCode})`,
            rule.currency,
            `${Math.round(rule.employerCostPercent * 100)}%`,
            `${Math.round(rule.employeeTaxPercent * 100)}%`,
          ])} />
        </Panel>
        <Panel title="Operational totals">
          <div className="stats compact">
            <Stat label="Invoices" value={invoices.data?.length ?? 0} />
            <Stat label="Leave" value={leave.data?.length ?? 0} />
            <Stat label="Timesheets" value={timesheets.data?.length ?? 0} />
            <Stat label="Offboarding" value={offboarding.data?.length ?? 0} />
            <Stat label="Audit logs" value={audit.data?.length ?? 0} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function useLoad<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    loader().then(setData).catch((err) => setError((err as Error).message));
  }, [tick, ...deps]);
  return { data, error, reload: () => setTick((value) => value + 1) };
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="muted">{subtitle}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <header>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  return (
    <span className="badge">
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>No records yet.</td></tr>
          ) : rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return <p className="error">{error}</p>;
}
