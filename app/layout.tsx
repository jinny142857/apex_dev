import './globals.css';
export const metadata = { title: 'APEX DEV', description: 'A workshop space for building ideas from school challenges' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
