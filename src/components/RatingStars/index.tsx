import { useTranslation } from 'react-i18next';

interface StarsProps { value: number; onChange?: (v: number) => void; size?: number; max?: number; }

/** Score as cupping-form boxes. Filled boxes are ink: the user's own score. */
export function Stars({ value, onChange, size = 12, max = 5 }: StarsProps) {
  const { t } = useTranslation();
  const interactive = onChange != null;
  const cellSize = interactive ? Math.max(size, 22) : size;
  return (
    <div
      className={`stars ${interactive ? 'interactive' : 'readonly'}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? t('extraction.fields.rating') : t('common.scoreOf', { value, max })}
    >
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value;
        if (!interactive) {
          return (
            <span key={i} className={filled ? 'filled' : ''}>
              {/* cell size is a runtime prop — allowed inline style exception */}
              <span className="cell" style={{ width: cellSize, height: cellSize }} />
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i + 1 === value}
            className={filled ? 'filled' : ''}
            onClick={() => onChange(i + 1 === value ? 0 : i + 1)}
            aria-label={t('common.starRating', { count: i + 1 })}
          >
            {/* cell size is a runtime prop — allowed inline style exception */}
            <span className="cell" style={{ width: cellSize, height: cellSize }} />
          </button>
        );
      })}
    </div>
  );
}
