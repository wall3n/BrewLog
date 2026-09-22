import type { ReactNode } from 'react';
import { Icon } from '../Icons';
import s from './styles.module.css';

interface EmptyProps { icon?: string; title: string; body?: string; action?: ReactNode; }

export function Empty({ icon = 'flask', title, body, action }: EmptyProps) {
  return (
    <div className={s.root}>
      <div className={s.icon}><Icon name={icon} size={22} /></div>
      <div className={s.title}>{title}</div>
      {body && <div className={s.body}>{body}</div>}
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
