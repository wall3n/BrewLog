import type { ReactNode } from 'react';
import { Icon } from '../Icons';

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
