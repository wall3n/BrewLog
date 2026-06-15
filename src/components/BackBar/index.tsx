import { Icon } from '../Icons';

export function BackBar({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="btn btn-ghost" style={{ padding: '6px 10px', marginBottom: 16 }} onClick={onClick}>
      <Icon name="arrowLeft" size={16} />
      <span>{label}</span>
    </button>
  );
}
