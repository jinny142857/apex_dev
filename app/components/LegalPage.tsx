'use client';

import Link from 'next/link';
import { LanguageSwitch, useLanguage } from './LanguageProvider';

type LegalDocument = 'privacy' | 'terms';

const privacy = {
  ko: {
    label: 'APEX DEV · 안내', title: '개인정보처리방침', updated: '시행일: 2026년 10월 8일',
    intro: 'APEX DEV는 서울특별시교육청이 주관하는 교원 연수에서 사용하는 학습 공간이며, 사이트와 계정·콘텐츠는 연수 운영 담당자가 관리합니다. 이 방침은 서비스에서 처리하는 정보와 이용 방법을 설명합니다.',
    sections: [
      ['1. 처리 목적과 항목', '계정 생성·로그인을 위해 실명(닉네임), 이메일 주소, 비밀번호를 처리합니다. 비밀번호는 Firebase Authentication에서 인증 목적으로 처리되며, 서비스 운영자가 원문 비밀번호를 열람하지 않습니다. 연수 운영과 협업을 위해 참가자가 직접 작성한 사전 과제, 기획 문서, 작업 링크·설명, 댓글·좋아요, 팀 선택 및 평가 정보를 처리합니다. 학생의 이름, 연락처, 건강 정보 등 학생을 식별하거나 민감한 정보는 입력하지 마세요.'],
      ['2. 공개 범위', '게시를 선택한 과제와 결과물, 작성자 실명(닉네임), 댓글은 해당 연수 공간의 로그인한 참가자 및 관리자에게 표시됩니다. 계정 정보와 이메일은 연수 참가자에게 공개하지 않고 계정·연수 운영에 사용합니다.'],
      ['3. 보유 기간', '계정 정보와 연수 기록은 계정·연수 운영 목적에 필요한 기간 동안 보유합니다. 목적이 끝나거나 삭제 요청이 접수되면 관련 법령과 연수 운영 담당자의 보존 기준에 따라 필요한 정보를 파기합니다. 법령에 따라 보존해야 하는 경우에는 해당 기간 동안 분리 보관합니다.'],
      ['4. 처리 업무 위탁 및 서비스 제공자', '서비스는 Firebase Authentication 및 Cloud Firestore를 이용해 계정 인증과 데이터를 저장하고, Vercel을 통해 웹 호스팅됩니다. 각 제공자는 서비스 제공과 보안 유지에 필요한 범위에서 정보를 처리합니다. 저장·처리 위치와 보유 세부사항은 운영 프로젝트의 클라우드 설정 및 제공자 계약을 따릅니다.'],
      ['5. 자동 수집 정보', '서비스는 광고·행태 분석 도구를 사용하지 않습니다. 언어 선택과 Demo mode 접근 상태를 브라우저의 로컬 저장소에 저장합니다. 웹 호스팅 및 보안 운영 과정에서 접속 기록이 생성될 수 있으며, 해당 기록은 서비스 제공자의 정책에 따라 관리됩니다.'],
      ['6. 정보주체의 권리', '이용자는 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 계정 정보 수정 또는 게시물 보관 요청은 개인정보 보호 담당 연락처로 문의해 주세요. 관련 권리는 개인정보 보호법 등 관계 법령에 따른 제한이 있을 수 있습니다.'],
      ['7. 개인정보 보호 문의', '개인정보 처리에 관한 문의와 권리 요청은 아래 이메일로 접수해 주세요. 서울특별시교육청은 행사를 주관하며, 이 사이트의 계정과 콘텐츠는 연수 운영 담당자가 관리합니다.'],
      ['8. 방침 변경', '이 방침이 변경되면 이 페이지에 변경 내용과 시행일을 게시합니다.'],
    ],
  },
  en: {
    label: 'APEX DEV · INFORMATION', title: 'Privacy Policy', updated: 'Effective October 8, 2026',
    intro: 'APEX DEV is a learning space used for teacher professional learning organized by the Seoul Metropolitan Office of Education. The workshop team manages this site, its accounts, and its content. This policy explains the information handled by the service.',
    sections: [
      ['1. Purposes and information', 'We process your real name (used as your nickname), email address, and password to create and access an account. Firebase Authentication handles passwords for sign-in; service administrators cannot view them in plain text. We also process the pre-work, planning documents, work links and descriptions, comments, likes, team selections, and evaluation information you submit for workshop activities. Do not enter student names, contact details, health information, or other information that identifies a student or is sensitive.'],
      ['2. Who can see your information', 'Posts and outcomes you publish, your real name (nickname), and comments are visible to signed-in participants and administrators in the workshop space. Your account details and email address are not shown to other participants; they are used for account and workshop administration.'],
      ['3. Retention', 'Account information and workshop records are kept for as long as needed to operate the account and workshop. When the purpose ends or a deletion request is received, information is deleted under applicable law and the workshop operator’s retention schedule. Information required by law is retained separately for the legally required period.'],
      ['4. Service providers', 'The service uses Firebase Authentication and Cloud Firestore for account authentication and data storage, and Vercel for web hosting. These providers process information as needed to deliver and secure the service. Storage locations and detailed retention follow the cloud project configuration and provider agreements.'],
      ['5. Automatically collected information', 'The service does not use advertising or behavioral analytics tools. Your language choice and Demo mode access are stored in your browser’s local storage. Hosting and security operations may produce access logs, which are managed under the hosting provider’s policies.'],
      ['6. Your rights', 'You may request access to, correction, deletion, or restriction of your personal information. Contact the privacy contact below to request an account update or removal of a post. Applicable laws may limit these rights in some cases.'],
      ['7. Privacy contact', 'For privacy questions or requests, email the contact address below. The Seoul Metropolitan Office of Education organizes the event; the workshop team manages this site’s accounts and content.'],
      ['8. Changes', 'Changes to this policy and their effective dates will be posted on this page.'],
    ],
  },
};

const terms = {
  ko: {
    label: 'APEX DEV · 안내', title: '이용약관', updated: '시행일: 2026년 10월 8일',
    intro: '이 약관은 서울특별시교육청 교원 연수의 학습 공간인 APEX DEV 이용에 적용됩니다. 서비스를 이용하면 아래 내용을 확인하고 동의한 것으로 봅니다.',
    sections: [
      ['1. 서비스 목적', 'APEX DEV는 연수 참가자가 학교 현장의 문제를 정의하고, 웹앱 기획·제작 과정을 기록하며, 결과물과 피드백을 연수 구성원과 나누도록 지원합니다.'],
      ['2. 계정 이용', '참가자는 본인의 실명을 닉네임으로 등록하고 계정 정보를 안전하게 관리해야 합니다. 다른 사람의 계정을 사용하거나 계정을 양도할 수 없습니다.'],
      ['3. 게시물과 공유', '게시된 과제·기획·결과물·댓글은 연수 공간의 참가자와 관리자에게 공유됩니다. 학생이나 제3자를 알아볼 수 있는 개인정보, 민감정보, 비밀번호, 저작권을 침해하는 자료를 게시하지 마세요. 게시한 내용의 권리는 작성자에게 있으며, 작성자는 연수 진행과 기록을 위해 서비스가 해당 내용을 연수 공간에서 저장·표시할 수 있도록 허용합니다.'],
      ['4. 외부 링크와 저작물', '외부 웹사이트 링크는 작성자가 제공하며, 해당 사이트의 운영과 내용은 APEX DEV가 통제하지 않습니다. 다른 사람의 저작물은 이용 권한을 확보한 뒤 게시해야 합니다.'],
      ['5. 금지 행위 및 운영 조치', '서비스 방해, 타인 사칭, 타인의 권리 침해, 부적절하거나 불법적인 콘텐츠 게시를 금지합니다. 운영자는 안전한 연수 운영에 필요한 경우 게시물을 숨기거나 계정 접근을 제한할 수 있습니다.'],
      ['6. 서비스 변경·중단', '연수 운영, 보안, 유지보수를 위해 서비스 일부가 변경되거나 일시 중단될 수 있습니다. 운영자는 변경 사항을 가능한 범위에서 서비스 내에 안내합니다.'],
      ['7. 약관 변경', '약관이 변경되면 이 페이지에 변경 내용과 시행일을 게시합니다.'],
    ],
  },
  en: {
    label: 'APEX DEV · INFORMATION', title: 'Terms of Use', updated: 'Effective October 8, 2026',
    intro: 'These terms apply to APEX DEV, a learning space for teacher professional learning organized with the Seoul Metropolitan Office of Education. By using the service, you agree to these terms.',
    sections: [
      ['1. Purpose', 'APEX DEV helps participants define a real school challenge, document the planning and building of a web app, and share outcomes and feedback with the workshop community.'],
      ['2. Accounts', 'Use your real name as your nickname and keep your account credentials secure. Do not use or transfer another person’s account.'],
      ['3. Posts and sharing', 'Published assignments, plans, outcomes, and comments are shared with participants and administrators in the workshop space. Do not post information that identifies a student or another person, sensitive information, passwords, or material that infringes copyright. You retain rights to your work and allow the service to store and display it within the workshop space for learning and recordkeeping.'],
      ['4. External links and content', 'External links are provided by participants. APEX DEV does not control those websites or their content. Obtain permission before posting someone else’s copyrighted work.'],
      ['5. Prohibited use and moderation', 'Do not disrupt the service, impersonate others, infringe rights, or post unlawful or inappropriate content. Administrators may hide posts or restrict access when needed to keep the workshop safe and functional.'],
      ['6. Changes or interruption', 'Parts of the service may change or be temporarily unavailable for workshop operations, security, or maintenance. The operator will provide notice within the service where practicable.'],
      ['7. Changes to these terms', 'Changes to these terms and their effective dates will be posted on this page.'],
    ],
  },
};

export default function LegalPage({ document }: { document: LegalDocument }) {
  const { language } = useLanguage();
  const korean = language === 'ko';
  const copy = (document === 'privacy' ? privacy : terms)[language];

  return <main className="legal-shell">
    <header className="legal-header"><Link href="/" className="legal-brand">APEX DEV</Link><span>{korean ? '행사 주관: 서울특별시교육청' : 'Event organized by the Seoul Metropolitan Office of Education'}</span><LanguageSwitch/></header>
    <article className="legal-document">
      <p className="eyebrow">{copy.label}</p>
      <h1>{copy.title}</h1>
      <p className="legal-updated">{copy.updated}</p>
      <p className="legal-intro">{copy.intro}</p>
      {copy.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      {document === 'privacy' && <p className="legal-contact"><span>{korean ? '개인정보 보호 문의' : 'Privacy contact'}</span><a href="mailto:jinny142857@gmail.com">jinny142857@gmail.com</a></p>}
      <Link href="/" className="legal-back">{korean ? '← APEX DEV로 돌아가기' : '← Back to APEX DEV'}</Link>
    </article>
  </main>;
}

export function LegalModal({ document, onClose }: { document: LegalDocument; onClose: () => void }) {
  const { language } = useLanguage();
  const korean = language === 'ko';
  const copy = (document === 'privacy' ? privacy : terms)[language];

  return <div className="legal-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
      <header className="legal-modal-header"><div><p className="eyebrow">{copy.label}</p><h2 id="legal-modal-title">{copy.title}</h2><p>{copy.updated}</p></div><button type="button" className="legal-modal-close" onClick={onClose} aria-label={korean ? '닫기' : 'Close'}>×</button></header>
      <div className="legal-modal-content"><p className="legal-intro">{copy.intro}</p>{copy.sections.map(([heading, body]) => <section key={heading}><h3>{heading}</h3><p>{body}</p></section>)}{document === 'privacy' && <p className="legal-contact"><span>{korean ? '개인정보 보호 문의' : 'Privacy contact'}</span><a href="mailto:jinny142857@gmail.com">jinny142857@gmail.com</a></p>}</div>
      <footer className="legal-modal-footer"><button type="button" onClick={onClose}>{korean ? '닫기' : 'Close'}</button></footer>
    </section>
  </div>;
}
