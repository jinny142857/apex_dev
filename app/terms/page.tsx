import LegalPage from '@/app/components/LegalPage';
import SiteFooter from '@/app/components/SiteFooter';

export const metadata = { title: 'Terms of Use | APEX DEV' };

export default function TermsPage() {
  return <><LegalPage document="terms"/><SiteFooter/></>;
}
