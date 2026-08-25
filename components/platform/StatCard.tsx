export default function StatCard({
  label,
  value,
  sublabel,
  accent = "ink",
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "ink" | "jade" | "coral" | "amber";
}) {
  const accentClass = {
    ink: "text-ink",
    jade: "text-jade-600",
    coral: "text-coral-600",
    amber: "text-amber-600",
  }[accent];

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-bold ${accentClass}`}>{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-ink/40">{sublabel}</p>}
    </div>
  );
}
