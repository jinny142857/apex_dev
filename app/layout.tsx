import './globals.css';
import { LanguageProvider } from './components/LanguageProvider';
export const metadata = { title: 'APEX DEV', description: 'A workshop space for building ideas from school challenges' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>; }
