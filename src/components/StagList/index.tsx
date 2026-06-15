import type { ReactNode } from 'react';

export function StagList({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div>
      {items.map((child, i) => (
        <div key={i} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>{child}</div>
      ))}
    </div>
  );
}
