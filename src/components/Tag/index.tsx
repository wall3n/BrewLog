import type { ReactNode } from 'react';

interface TagProps { active?: boolean; onClick?: () => void; children: ReactNode; subtle?: boolean; }
export function Tag({ active, onClick, children, subtle }: TagProps) {
  return (
    <button type="button" className={`tag ${active ? 'active' : ''} ${subtle ? 'subtle' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
