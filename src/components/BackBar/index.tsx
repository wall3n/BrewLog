import { Icon } from '../Icons';
import s from './styles.module.css';

export function BackBar({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className={`btn btn-ghost ${s.btn}`} onClick={onClick}>
      <Icon name="arrowLeft" size={16} />
      <span>{label}</span>
    </button>
  );
}
