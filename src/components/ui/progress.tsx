type ProgressProps = {
  value: number;
};

export function Progress({ value }: ProgressProps) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
