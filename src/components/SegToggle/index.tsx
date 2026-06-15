export function SegToggle({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="row" style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, gap: 0 }}>
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} style={{
          background: value === k ? 'var(--bg-surface)' : 'transparent',
          color: value === k ? 'var(--text-primary)' : 'var(--text-secondary)',
          border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11,
          letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 120ms',
        }}>{l}</button>
      ))}
    </div>
  );
}
