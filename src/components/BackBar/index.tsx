import { Icon } from '../Icons';
import s from './styles.module.css';

export function BackBar({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className={s.btn} onClick={onClick}>
      <Icon name="arrowLeft" size={18} />
      <span>{label}</span>
    </button>
  );
}
