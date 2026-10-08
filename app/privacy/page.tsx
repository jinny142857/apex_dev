import LegalPage from '@/app/components/LegalPage';
import SiteFooter from '@/app/components/SiteFooter';

export const metadata = { title: 'Privacy Policy | APEX DEV' };

export default function PrivacyPage() {
  return <><LegalPage document="privacy"/><SiteFooter/></>;
}
