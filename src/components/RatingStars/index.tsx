import { Icon } from '../Icons';

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
