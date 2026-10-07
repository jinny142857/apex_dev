'use client';

import { useLanguage } from './LanguageProvider';

export default function PresentationOrder({ order }: { order: string[] }) {
  const { tr } = useLanguage();
  return <div className="presentation-order"><span className="presentation-order-label">{tr('Presentation order')}</span><ol>{order.map((team, index) => <li key={team}><span className="presentation-order-number">{String(index + 1).padStart(2, '0')}</span><strong>Team {team}</strong></li>)}</ol></div>;
}
