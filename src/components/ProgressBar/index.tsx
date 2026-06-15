import './styles.module.css';

export function ProgressBar({ value, max = 1 }: { value: number; max?: number }) {
  return (
    <div className="progress-track">
      {/* dynamic width — allowed inline style exception */}
      <div className="progress-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}
