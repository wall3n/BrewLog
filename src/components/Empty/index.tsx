import { Icon } from '../Icons';
import s from './styles.module.css';

export function Empty({ icon = 'flask', title, body }: { icon?: string; title: string; body?: string }) {
  return (
    <div className={`card ${s.root}`}>
      <div className={s.icon}><Icon name={icon} size={28} /></div>
      <div className={`h-display ${s.title}`}>{title}</div>
      {body && <div className={`t-sec ${s.body}`}>{body}</div>}
    </div>
  );
}
