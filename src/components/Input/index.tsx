import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import s from './styles.module.css';

interface FieldProps { label?: string; hint?: string; right?: ReactNode; children: ReactNode; }
export function Field({ label, hint, children, right }: FieldProps) {
  return (
    <div className="field">
      {(label || right) && (
        <div className={`row row-between ${s.fieldHeader}`}>
          {label && <span className="field-label">{label}</span>}
          {right}
        </div>
      )}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { large?: boolean; }
export function Input({ large, ...rest }: InputProps) {
  return <input className={large ? 'input-large' : 'input-underline'} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input-underline" rows={3} {...props} />;
}
