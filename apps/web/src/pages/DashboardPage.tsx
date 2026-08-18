import { useClientsQuery } from '../api/useClientsQuery.js';
import { ClientsChart } from '../components/chart/ClientsChart.js';
import { toChartData } from '../components/chart/toChartData.js';

function ChartCardSkeleton() {
  return (
    <div
      role="status"
      className="h-[380px] animate-pulse rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-sm"
    >
      <span className="sr-only">Loading</span>
      <div className="h-full w-full rounded-lg bg-black/5" />
    </div>
  );
}

function TableCardSkeleton() {
  return (
    <div
      role="status"
      className="h-40 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-sm"
    >
      <span className="sr-only">Loading</span>
      <div className="h-full w-full rounded-lg bg-black/5" />
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-sm">
      <p className="text-[var(--color-text-primary)]">
        Something went wrong while loading client data.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full bg-[var(--color-series-existing)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:opacity-90"
      >
        Retry
      </button>
    </div>
  );
}

function DashboardContent() {
  const query = useClientsQuery();

  if (query.isPending) {
    return (
      <>
        <ChartCardSkeleton />
        <TableCardSkeleton />
      </>
    );
  }

  if (query.isError) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  return (
    <>
      <section className="rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-sm">
        <ClientsChart data={toChartData(query.data.data)} />
      </section>

      <section className="rounded-[var(--radius-card)] bg-[var(--color-card)] p-6 shadow-sm">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Table coming
          <span className="sr-only">
            : the detailed clients breakdown table will be added in a future update.
          </span>
        </p>
      </section>
    </>
  );
}

export function DashboardPage() {
  return (
    <main className="min-h-screen bg-[var(--color-page)] px-6 py-10 sm:px-10">
      <h1 className="mb-6 text-3xl font-semibold text-[var(--color-text-primary)] sm:text-4xl">
        Clients
      </h1>

      <div className="flex flex-col gap-6">
        <DashboardContent />
      </div>
    </main>
  );
}
