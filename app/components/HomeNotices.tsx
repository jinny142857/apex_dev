'use client';

import WorkshopIcon from '@/app/components/WorkshopIcon';
import { useLanguage } from '@/app/components/LanguageProvider';

export default function HomeNotices({ onPrework, onSurvey }: { onPrework: () => void; onSurvey: () => void }) {
  const { tr } = useLanguage();
  return <section className="home-dashboard simple-home"><div className="simple-home-intro"><span className="eyebrow">APEX DEV</span><h1>{tr('Before the workshop')}</h1><p>{tr('Please submit your pre-work assignment and complete the survey before we meet.')}</p></div><div className="simple-home-actions"><button onClick={onPrework}><span className="simple-home-icon"><WorkshopIcon name="assignment"/></span><strong>{tr('Submit pre-work')}</strong><WorkshopIcon name="arrow" className="simple-home-arrow"/></button><button onClick={onSurvey}><span className="simple-home-icon"><WorkshopIcon name="survey"/></span><strong>{tr('Answer the survey')}</strong><WorkshopIcon name="arrow" className="simple-home-arrow"/></button></div></section>;
}
