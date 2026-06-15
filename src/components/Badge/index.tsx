import { useTranslation } from 'react-i18next';
import { Icon } from '../Icons';
import { methodById } from '../../utils/methodDefaults';

export function MethodBadge({ method }: { method: string }) {
  const m = methodById(method);
  const { t } = useTranslation();
  return (
    <span className="method-badge">
      <Icon name={m.icon} size={11} />
      {t(`methods.${method}`, { defaultValue: m.name })}
    </span>
  );
}
