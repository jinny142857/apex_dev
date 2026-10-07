import type { SVGProps } from 'react';

type Name = 'assignment' | 'survey' | 'people' | 'screen' | 'trophy' | 'spark' | 'arrow' | 'check' | 'document';

export default function WorkshopIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...common} {...props}>
    {name === 'assignment' && <><rect x="4" y="4" width="16" height="17" rx="2"/><path d="M9 4.5h6M8 10h8M8 14h8M8 18h5"/></>}
    {name === 'survey' && <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16l2 2 4-4"/></>}
    {name === 'people' && <><circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2.2A4.8 4.8 0 0 1 8.3 13h1.4a4.8 4.8 0 0 1 4.8 4.8V20H3.5ZM16 5a3 3 0 0 1 0 6M17 13a4.8 4.8 0 0 1 3.5 4.6V20h-3"/></>}
    {name === 'screen' && <><rect x="2.5" y="4" width="19" height="14" rx="2"/><path d="M8 21h8M12 18v3M2.5 8h19"/></>}
    {name === 'trophy' && <><path d="M7 3h10v6a5 5 0 0 1-10 0V3ZM7 5H4v3a4 4 0 0 0 4 4M17 5h3v3a4 4 0 0 1-4 4M12 14v4M8 21h8M9 18h6v3H9z"/></>}
    {name === 'spark' && <><path d="m12 2 1.9 7.1L21 11l-7.1 1.9L12 20l-1.9-7.1L3 11l7.1-1.9L12 2ZM19 17l.7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17Z"/></>}
    {name === 'arrow' && <><path d="M4 12h16M14 6l6 6-6 6"/></>}
    {name === 'check' && <path d="m4 12 5 5L20 6"/>}
    {name === 'document' && <><path d="M6 2h8l4 4v16H6V2ZM14 2v5h4M9 11h6M9 15h6M9 19h4"/></>}
  </svg>;
}
