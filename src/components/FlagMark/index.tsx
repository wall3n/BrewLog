import { useTranslation } from 'react-i18next';
import { Icon } from '../Icons';
import { flagIcon } from '../../utils/shots';
import type { Extraction } from '../../db/types';

interface FlagMarkProps { flag: Extraction['flag']; stamp?: boolean; iconOnly?: boolean; size?: number; }

/** Outcome as a mark plus colour, so it reads in greyscale too. */
export function FlagMark({ flag, stamp = false, iconOnly = false, size = 13 }: FlagMarkProps) {
  const { t } = useTranslation();
  const label = t(`extraction.flags.${flag}`);
  return (
    <span className={`flag-mark ${flag}${stamp ? ' stamp' : ''}`} aria-label={iconOnly ? label : undefined} title={iconOnly ? label : undefined}>
      <Icon name={flagIcon(flag)} size={size} strokeWidth={2.25} />
      {!iconOnly && <span>{label}</span>}
    </span>
  );
}

