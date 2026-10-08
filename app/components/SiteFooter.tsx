'use client';

import { useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { LegalModal } from './LegalPage';

export default function SiteFooter() {
  const { language } = useLanguage();
  const korean = language === 'ko';
  const [openDocument, setOpenDocument] = useState<'privacy' | 'terms' | null>(null);

  return <footer className="site-footer">
    <div className="site-footer-inner">
      <span className="site-footer-credit">APEX DEV <span aria-hidden="true">·</span> {korean ? '행사 주관: 서울특별시교육청' : 'Event organized by the Seoul Metropolitan Office of Education'}</span>
      <nav aria-label={korean ? '법률 안내' : 'Legal information'}>
        <button type="button" onClick={() => setOpenDocument('privacy')}>{korean ? '개인정보처리방침' : 'Privacy policy'}</button>
        <button type="button" onClick={() => setOpenDocument('terms')}>{korean ? '이용약관' : 'Terms of use'}</button>
      </nav>
    </div>
    {openDocument && <LegalModal document={openDocument} onClose={() => setOpenDocument(null)}/>}
  </footer>;
}
