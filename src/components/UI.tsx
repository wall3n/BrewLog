import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Icon } from './Icons';
import { daysSince, roastBucket } from '../utils/formatters';
import { methodById } from '../utils/methodDefaults';

// Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'lg';
  full?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  children?: ReactNode;
}
export function Button({ variant = 'primary', size, full, leftIcon, rightIcon, children, className = '', ...rest }: ButtonProps) {
  const cls = ['btn',
    variant === 'primary' ? 'btn-primary' : '',
    variant === 'ghost' ? 'btn-ghost' : '',
    variant === 'danger' ? 'btn-danger' : '',
    size === 'lg' ? 'btn-lg' : '',
    full ? 'btn-full' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {leftIcon && <Icon name={leftIcon} size={16} />}
      {children && <span>{children}</span>}
      {rightIcon && <Icon name={rightIcon} size={16} />}
    </button>
  );
}

// Field
interface FieldProps { label?: string; hint?: string; right?: ReactNode; children: ReactNode; }
export function Field({ label, hint, children, right }: FieldProps) {
  return (
    <div className="field">
      {(label || right) && (
        <div className="row row-between" style={{ alignItems: 'baseline' }}>
          {label && <span className="field-label">{label}</span>}
          {right}
        </div>
      )}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

// Input
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { large?: boolean; }
export function Input({ large, ...rest }: InputProps) {
  return <input className={large ? 'input-large' : 'input-underline'} {...rest} />;
}

// Textarea
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input-underline" rows={3} {...props} />;
}

// Slider
interface SliderProps {
  value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; label?: string; displayValue?: string | number;
}
export function Slider({ value, min = 1, max = 5, step = 1, onChange, label, displayValue }: SliderProps) {
  return (
    <div className="slider-row">
      {label && <span className="slider-label">{label}</span>}
      <input type="range" className="brew-slider" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
      <span className="slider-val">{displayValue ?? value}</span>
    </div>
  );
}

// Stars
interface StarsProps { value: number; onChange?: (v: number) => void; size?: number; max?: number; }
export function Stars({ value, onChange, size = 18, max = 5 }: StarsProps) {
  return (
    <div className="stars">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        return (
          <button key={i} type="button" className={filled ? 'filled' : ''} onClick={() => onChange?.(i + 1 === value ? 0 : i + 1)} aria-label={`${i + 1} star`}>
            <Icon name={filled ? 'starFill' : 'star'} size={size} />
          </button>
        );
      })}
    </div>
  );
}

// Tag
interface TagProps { active?: boolean; onClick?: () => void; children: ReactNode; subtle?: boolean; }
export function Tag({ active, onClick, children, subtle }: TagProps) {
  return (
    <button type="button" className={`tag ${active ? 'active' : ''} ${subtle ? 'subtle' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

// MethodBadge
export function MethodBadge({ method }: { method: string }) {
  const m = methodById(method);
  return (
    <span className="method-badge">
      <Icon name={m.icon} size={11} />
      {m.name}
    </span>
  );
}

// Sheet / Modal
interface SheetProps { open: boolean; onClose: () => void; title: string; children: ReactNode; foot?: ReactNode; }
export function Sheet({ open, onClose, title, children, foot }: SheetProps) {
  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="row row-between" style={{ marginBottom: 20 }}>
          <h3 className="h-display" style={{ margin: 0, fontSize: 22 }}>{title}</h3>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4 }} onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </div>
        {children}
        {foot && <div style={{ marginTop: 20 }}>{foot}</div>}
      </div>
    </div>
  );
}

// ProgressBar
export function ProgressBar({ value, max = 1 }: { value: number; max?: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

// RoastDot
export function RoastDot({ level }: { level: string }) {
  return <span className={`roast-dot ${level}`} title={level} />;
}

// DaysOffRoast
export function DaysOffRoast({ iso }: { iso?: string }) {
  const d = daysSince(iso);
  if (d == null) return <span className="t-ter t-mono">—</span>;
  const bucket = roastBucket(d);
  return <span className={`days-pill ${bucket}`}>{d}d off roast</span>;
}

// Empty state
export function Empty({ icon = 'flask', title, body }: { icon?: string; title: string; body?: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 12 }}><Icon name={icon} size={28} /></div>
      <div className="h-display" style={{ fontSize: 18, marginBottom: 4 }}>{title}</div>
      {body && <div className="t-sec" style={{ fontSize: 12 }}>{body}</div>}
    </div>
  );
}

// Staggered list
export function StagList({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div>
      {items.map((child, i) => (
        <div key={i} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>{child}</div>
      ))}
    </div>
  );
}

// BackBar
export function BackBar({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="btn btn-ghost" style={{ padding: '6px 10px', marginBottom: 16 }} onClick={onClick}>
      <Icon name="arrowLeft" size={16} />
      <span>{label}</span>
    </button>
  );
}

// FAB
export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab" onClick={onClick} aria-label="New extraction">
      <Icon name="plus" size={24} />
    </button>
  );
}

// SegToggle (settings)
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
