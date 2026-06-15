import { Icon } from '../Icons';

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab" onClick={onClick} aria-label="New extraction">
      <Icon name="plus" size={24} />
    </button>
  );
}
