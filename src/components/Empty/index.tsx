import { Icon } from '../Icons';

export function Empty({ icon = 'flask', title, body }: { icon?: string; title: string; body?: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 12 }}><Icon name={icon} size={28} /></div>
      <div className="h-display" style={{ fontSize: 18, marginBottom: 4 }}>{title}</div>
      {body && <div className="t-sec" style={{ fontSize: 12 }}>{body}</div>}
    </div>
  );
}
