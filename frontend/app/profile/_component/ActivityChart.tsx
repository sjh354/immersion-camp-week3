interface ActivityChartProps {
  label: string;
  value: number;
}

export function ActivityChart({ label, value }: ActivityChartProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-base font-semibold">{label}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </section>
  );
}
