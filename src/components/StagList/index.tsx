import type { ReactNode } from 'react';
import './styles.module.css';

export function StagList({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div>
      {items.map((child, i) => (
        // animationDelay is dynamic — allowed inline style exception
        <div key={i} className="fade-up" style={{ animationDelay: `${i * 30}ms` }}>{child}</div>
      ))}
    </div>
  );
}
