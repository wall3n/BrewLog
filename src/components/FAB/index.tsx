import { useTranslation } from 'react-i18next';
import { Icon } from '../Icons';

export function FAB({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button className="fab" onClick={onClick} aria-label={t('common.newExtraction')}>
      <Icon name="plus" size={24} />
    </button>
  );
}
