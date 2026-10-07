'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ko';
const translations: Record<string, string> = {
  'Home': '홈', 'Survey': '사전 설문', 'Pre-work': '사전 과제', 'Warm-up': '바이브코딩 맛보기',
  'Problem & PRD': '문제 정교화 & PRD', 'Final outcomes': '최종 산출물',
  'Present & evaluate': '발표·평가', 'Presentation & Evaluation': '발표 및 평가', 'Admin': '관리자',
  'Sign out': '로그아웃', 'Sign in': '로그인', 'Welcome back': '다시 오신 것을 환영합니다',
  'Create your account': '계정 만들기', 'Reset your password': '비밀번호 재설정',
  'Nickname': '닉네임', 'Password': '비밀번호', 'Email': '이메일', 'Your nickname': '닉네임을 입력하세요',
  'Your password': '비밀번호를 입력하세요', 'Hide': '숨기기', 'Show': '보기',
  'Create an account': '계정 만들기', 'Forgot password?': '비밀번호를 잊으셨나요?',
  'Create account': '가입하기', 'Send reset link': '재설정 링크 보내기', 'Back to sign in': '로그인으로 돌아가기',
  'YOUR WORKSHOP SPACE': '워크숍 공간',
  'Sign in to continue your work and explore ideas from the group.': '로그인하고 과제를 이어가며 다른 참가자의 아이디어를 살펴보세요.',
  'Start with a nickname. Your work will be shared when you publish it.': '닉네임으로 시작하세요. 게시할 때만 작성한 내용이 공유됩니다.',
  'Enter the email you used when creating your account.': '가입할 때 사용한 이메일을 입력하세요.',
  'New to APEX DEV?': '처음 오셨나요?', 'Already have an account?': '이미 계정이 있나요?',
  'At least 8 characters': '8자 이상',
  'We use your email for account recovery and workshop communication. Please do not enter student names or sensitive school information.': '이메일은 계정 복구와 워크숍 안내에만 사용합니다. 학생 이름이나 민감한 학교 정보는 입력하지 마세요.',
  'Guide': '과제 안내', 'New post': '새 글', 'Read post': '글 보기', 'Sample preview': '미리보기',
  'Demo mode': 'Demo mode', 'Exit preview': '미리보기 종료', 'Participant view': '참가자 화면',
  'Admin view': '관리자 화면', 'Team sharing': '대표작 선택', 'Representative selection': '대표작 선택', 'Final pitches': '최종 발표',
  'Award ceremony': '시상식', 'Presentation order': '발표 순서', 'Draw random order': '발표 순서 추첨',
  'Start presentation': '발표 시작', 'Try award ceremony': '시상식 체험',
  'Submit work': '산출물 제출', 'Presentation mode': '발표 모드', 'Individual outcomes': '개별 산출물',
  'Comments': '댓글', 'Add a comment': '댓글 남기기', 'Post comment': '댓글 등록',
  'Your evaluation': '내 평가', 'Evaluate pitch': '발표 평가하기', 'Edit review': '평가 수정',
  'Submit all scores': '평가 제출', 'Show works': '작품 목록 보기', 'Hide works': '작품 목록 접기',
  'Close window': '창 닫기', 'Minimize window': '창 최소화', 'Restore window': '창 복원',
  'Enter demo password': 'Demo mode 비밀번호', 'Enter preview': '미리보기 입장',
  'Incorrect password. Please try again.': '비밀번호가 맞지 않습니다. 다시 입력해 주세요.',
  'This stage opens on workshop day.': '워크숍 당일에 열립니다.', 'Back to Home': '홈으로 돌아가기',
  '4 final pitches': '최종 발표 4팀', 'Sample data only. Try every screen—nothing here is written to Firebase.': '샘플 데이터로 모든 화면을 체험할 수 있습니다. 실제 데이터는 저장되지 않습니다.',
  'Write your Pre-work post': '사전 과제 글쓰기', 'Share your warm-up': '바이브코딩 결과 공유',
  'Write your Problem & PRD post': '문제 정교화 & PRD 작성', 'Share your final outcome': '최종 산출물 공유',
  'Use the guide while you shape your problem statement.': '왼쪽 안내를 보며 문제 정의를 작성하세요.',
  'Start with a challenge from your school or teaching context.': '학교나 수업에서 만난 문제를 찾아보세요.',
  'Share what you made while following along.': '따라 만들며 완성한 결과를 공유하세요.',
  'Shape your problem into a clear, useful plan.': '문제를 다듬고 실천할 PRD를 작성하세요.',
  'Share your finished work and learn from your peers.': '완성한 산출물을 공유하고 서로의 작업을 살펴보세요.',
  '← Back to posts': '← 게시글로', '+ New post': '+ 새 글',
  'Before the workshop': '워크숍 시작 전',
  'Please submit your pre-work assignment and complete the survey before we meet.': '워크숍 전까지 사전 과제를 제출하고 설문에 참여해 주세요.',
  'Submit pre-work': '사전 과제 제출', 'Answer the survey': '설문 참여',
  'Individual works, shared together': '개별 산출물, 함께 나누기',
  'Each participant submits a work. Teams discuss and choose one presenter.': '모든 참가자가 산출물을 제출합니다. 팀원끼리 살펴보고 논의해 대표 작품 하나를 정합니다.',
  'Present Team A': 'A팀 발표하기', 'Team sharing & discussion': '팀별 공유와 협의',
  'Choose one team representative': '팀 대표 작품 선택',
  'Discuss your individual works together. A teammate then submits the work your team agreed to present.': '개별 산출물을 함께 보고 논의한 뒤, 팀원이 합의한 작품 하나를 대표작으로 등록합니다.',
  'All outcomes': '모든 산출물', 'Start team presentation': '팀 발표 시작',
  'Representatives': '팀 대표작', 'Open final pitches': '최종 발표 열기',
  'Final pitches & scoring': '최종 발표와 평가', 'Final pitch presentation': '최종 발표',
  'works': '개', 'Representative:': '대표:',
  'Team A’s agreed representative': 'A팀이 합의한 대표작',
  'A teammate submits the selected individual work after discussion.': '논의 후 팀원 한 명이 선택한 개별 산출물을 대표작으로 등록합니다.',
  'Save selection': '대표작 저장', 'Present →': '발표하기 →',
  'Preparing teams': '팀 구성 준비', 'Final award': '최종 시상',
  'Explore each team’s work': '팀별 산출물 살펴보기',
  'Discuss, then submit one work': '논의 후 대표작 하나를 등록하세요',
  'To be selected': '대표작을 선택해 주세요', 'Your team': '내 팀',
  'Open final scoring': '최종 평가 열기',
  'A quick check-in to help us prepare.': '워크숍 준비를 위한 간단한 사전 확인입니다.',
  'AI tools & subscriptions': 'AI 도구와 구독 현황',
  'Which AI tools do you currently use?': '현재 사용 중인 AI 도구가 있나요?',
  'Do you have access to a paid AI account?': '유료 AI 계정에 접근할 수 있나요?',
  'I pay for one or more plans': '하나 이상의 유료 요금제를 직접 구독합니다.',
  'My school provides access': '학교에서 계정을 제공합니다.',
  'I use free plans only': '무료 요금제만 사용합니다.',
  'I am not sure': '잘 모르겠습니다.',
  'If yes, which paid tools or plans?': '그렇다면 어떤 유료 도구 또는 요금제를 사용하나요?',
  'What would you like to try with AI during the workshop?': '워크숍에서 AI로 무엇을 해 보고 싶나요?',
  'Open': '진행 중', 'Closed': '마감', 'Deadline:': '응답 마감:',
  'Response saved': '응답이 저장되었습니다.', 'Submit response': '응답 제출', 'Update response': '응답 수정',
  'Choose one': '하나를 선택하세요', 'Loading…': '불러오는 중…',
};
const LanguageContext = createContext<{ language: Language; setLanguage: (value: Language) => void; tr: (value: string) => string }>({ language: 'en', setLanguage: () => {}, tr: value => value });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, updateLanguage] = useState<Language>('en');
  useEffect(() => { const saved = localStorage.getItem('apexDevLanguage'); if (saved === 'ko') updateLanguage('ko'); }, []);
  const setLanguage = (value: Language) => { updateLanguage(value); localStorage.setItem('apexDevLanguage', value); document.documentElement.lang = value; };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, tr: value => language === 'ko' ? translations[value] || value : value }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-switch" role="group" aria-label="Language / 언어"><button type="button" className={language === 'ko' ? 'active' : ''} onClick={() => setLanguage('ko')}>한글</button><button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button></div>;
}
