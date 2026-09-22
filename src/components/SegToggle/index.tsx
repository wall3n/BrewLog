import s from './styles.module.css';

export function SegToggle({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className={`row ${s.root}`}>
      {options.map(([k, l]) => (
        <button type="button" key={k} aria-pressed={value === k} onClick={() => onChange(k)} className={`${s.btn}${value === k ? ` ${s.active}` : ''}`}>{l}</button>
      ))}
    </div>
  );
}
