const styles = {
  active: "border-[var(--accent)] text-[var(--accent)]",
  normal: "border-[var(--accent)] text-[var(--accent)]",
  open: "border-[var(--brand)] text-[var(--brand)]",
  watch: "border-[var(--warning)] text-[var(--warning)]",
  warning: "border-[var(--warning)] text-[var(--warning)]",
  critical: "border-[var(--danger)] text-[var(--danger)]",
  expired: "border-[var(--text-muted)] text-[var(--text-muted)]",
};

export default function StatusBadge({ value }) {
  const key = (value || "normal").toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-md border bg-[var(--surface-strong)] px-2 py-0.5 text-xs font-medium transition-colors ${styles[key] || styles.normal}`}
    >
      {value || "normal"}
    </span>
  );
}
