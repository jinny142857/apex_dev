# 바이브 코딩 연수 웹앱 PRD

## 1. 제품 개요

- **제품명:** APEX DEV
- **목적:** 연수 참가자가 학교 현장의 문제를 정의하고, 이를 간단한 PRD와 웹앱 MVP로 발전시키는 과정을 기록하고 공유하도록 지원함.
- **대상 사용자:** 교육 ODA 수혜국의 우수 교원 연수 참가자
- **핵심 흐름:** 사전 과제 작성 → 문제 정교화 및 PRD 작성 → MVP 링크 공유와 동료 피드백
- **기본 원칙:** 참가자 각자가 자신의 페이지에서 개별적으로 작업하고, 공개에 동의한 산출물만 다른 참가자와 공유함.
- **디자인기준:** 기존 로고(SchoolLab_logo.png)의 네이비·블루 계열 색상을 유지하고, 앱 아이콘은 코드 기호를 사용함. 전체 UI는 간결하고 세련되게 구성함.

## 2. 사용자와 접근 권한

### 참가자

- 닉네임과 비밀번호로 계정을 생성하고 로그인함.
- 자신의 사전 과제, PRD, 산출물 링크를 작성·수정함.
- 다른 참가자가 공개한 산출물을 열람하고 댓글을 작성함.

### 운영자

- 참가자 계정과 제출 내용을 관리함.
- 부적절한 댓글이나 공개 콘텐츠를 숨기거나 삭제할 수 있음.

## 3. 사용자 여정

1. 참가자가 닉네임, 비밀번호, 이메일을 입력해 계정을 생성함.
2. 사전 과제에서 Problem Statement를 작성하거나 과제 내용을 입력함.
3. 작성한 Problem Statement를 불러와 문제를 정교화하고 간단한 PRD를 작성함.
4. 작성 내용을 확인하고 Markdown 파일로 내려받음.
5. 바이브 코딩으로 제작한 MVP 링크를 제출함.
6. 공개된 다른 참가자의 페이지를 방문하고 댓글과 피드백을 남김.

페이지 상단에는 세 단계의 진행 상태가 표시되어야 함. 예: **Pre-work → PRD → Share your MVP**. 각 단계의 완료 여부를 사용자가 확인할 수 있어야 함.

## 4. 기능 요구사항

### 4.1 계정 생성 및 로그인

#### 계정 생성

- 닉네임, 비밀번호, 개인 이메일을 입력해 계정을 생성함.
- 닉네임은 고유해야 함.
- 이미 사용 중인 닉네임을 입력하면 다른 닉네임을 선택하도록 안내함.
- 계정 생성 직후 닉네임과 비밀번호를 기억하라는 모달을 표시함.
- 모달에는 비밀번호를 안전하게 보관하고 타인과 공유하지 말라는 안내를 포함함.
- 이메일은 계정 복구 또는 연수 운영 연락 목적으로 수집함. 수집 목적과 활용 범위를 등록 화면에 안내함.

#### 로그인

- 닉네임과 비밀번호를 입력해 로그인함.
- 로그인 후 해당 사용자의 개인 페이지로 이동함.
- 로그아웃 전까지 로그인 상태를 유지할 수 있음.
- 잘못된 정보 입력 시 구체적이되 계정 존재 여부를 노출하지 않는 오류 안내를 표시함.

#### 보안 및 개인정보 요구사항

- 비밀번호를 평문으로 저장하지 않고 안전한 인증 방식으로 보호함.
- 이메일은 다른 참가자에게 공개하지 않음.
- 개인 페이지의 과제와 PRD는 기본적으로 비공개로 저장하고, 사용자가 공유를 선택한 산출물만 공개함.
- 실제 학생의 이름, 사진, 민감한 학교 정보를 입력하지 않도록 안내함.

### 4.2 사전 과제 페이지

#### 과제 콘텐츠 및 유지 관리

- 사전 과제 안내, Problem Statement 템플릿, 항목 설명, 작성 예시는 별도의 Markdown 콘텐츠 파일을 원본으로 사용함.
- 파일명: `APEX_SchoolLab_Problem_Statement_Prework.md`
- 웹앱 프로젝트 경로: `public/content/problem-statement-assignment.md`
- 과제 문구를 UI 컴포넌트나 앱 코드에 직접 하드코딩하지 않음.
- 웹앱은 해당 Markdown 파일을 읽어 제목, 안내, 템플릿, 설명, 예시를 참가자 화면에 표시함.
- 콘텐츠 수정은 Markdown 파일을 편집한 뒤 앱을 다시 배포하는 방식으로 반영함. 콘텐츠를 바꿀 때 UI 코드를 수정할 필요가 없어야 함.
- 별도 Markdown 파일의 내용이 참가자 화면에서 자연스럽고 읽기 쉬운 영어로 표시되어야 함.

#### 참가자 입력 기능

- 참가자는 사전 과제 안내에 따라 자신의 학교 현장 문제를 Problem Statement로 작성함.
- 입력창에는 기본 템플릿을 회색 안내 텍스트로 보여주고, 입력을 시작하면 안내 텍스트가 사라지도록 함.
- 템플릿과 별도로 예시 Problem Statement를 확인할 수 있어야 함.
- 과제 내용을 저장하고 이후 PRD 페이지에서 불러올 수 있어야 함.
- 참가자는 제출한 내용을 언제든 수정할 수 있어야 함.

#### 참가자에게 표시할 과제 내용

**Purpose**

Before the workshop, identify one challenge from your school or teaching context. You will use this challenge to explore how a simple web app might help. Focus on understanding the problem before proposing a solution. You do not need to know yet whether an app can fully solve it.

**Problem Statement Template**

> **[WHO] struggle(s) to [SPECIFIC TASK OR PAIN] when [SITUATION / CONTEXT] because [ROOT CAUSE].**

**What Each Part Means**

- **WHO:** The person or group experiencing the problem. You may include what they are trying to achieve.
- **SPECIFIC TASK OR PAIN:** The specific task they find difficult or the problem they experience.
- **SITUATION / CONTEXT:** When or where the problem occurs.
- **ROOT CAUSE:** The underlying reason the problem occurs. Describe the cause, not a proposed solution.

**Example**

> **[Elementary school teachers who want to create a comfortable classroom where students interact positively with their peers] struggle to [create effective seating arrangements] when [changing seats] because [they need to consider several factors at once, such as students’ individual needs, peer relationships, and classroom dynamics].**

**Before You Submit**

- Describe one specific challenge from your school or teaching context.
- Explain the situation in which the challenge occurs.
- State the underlying cause as clearly as you can.
- Do not include a proposed app or tool as the problem itself.
- Do not include real student names, photos, or other sensitive personal information.

#### 구현 메모

- 참가자 입력란은 위 템플릿을 참고해 자유롭게 작성할 수 있도록 제공함.
- 과제 콘텐츠 Markdown과 참가자가 제출한 답변 데이터는 별도로 관리함. 콘텐츠 파일을 수정해도 참가자의 저장된 답변은 변경되거나 삭제되지 않아야 함.

### 4.3 문제 정교화 및 PRD 페이지

- 사전 과제에 입력한 Problem Statement를 페이지에 불러옴.
- 참가자가 문제 정의를 다시 확인하고 수정할 수 있음.
- 다음 네 항목을 입력해 간단한 PRD를 작성함.

| 항목 | 입력 안내 문구 |
|---|---|
| **Problem** | What problem are you trying to address? |
| **User** | Who will use the app? |
| **Goal** | What should users be able to do with the app? |
| **Core features** | What are the one or two most important features? |

- 각 입력창은 안내 문구가 회색으로 표시되는 placeholder를 사용함.
- 작성 내용을 자동 저장하거나 저장 상태를 명확히 표시함.
- 참가자가 입력한 내용을 한눈에 확인하고 수정할 수 있는 PRD 미리보기를 제공함.
- 작성된 PRD를 Markdown(.md) 파일로 내려받을 수 있어야 함.
- PRD 보완용 AI 기능을 추가하는 경우, 사용자가 요청했을 때만 작동하도록 함. AI가 수정한 내용은 참가자가 확인하고 편집한 뒤 저장하도록 함.
- AI 기능이 준비되지 않은 경우에도 입력 내용으로 PRD 미리보기와 Markdown 다운로드가 가능해야 함.
- 모든 페이지는 이해하기 쉬운 간결하지만 자연스러운 영어로 작성 및 구성되어야 함. 

### 4.4 산출물 공유 페이지

- 참가자가 자신이 제작한 MVP의 URL을 제출할 수 있어야 함.
- 다음 정보를 함께 입력할 수 있어야 함.
  - 앱 또는 프로젝트 이름
  - MVP 링크
  - 해결하려는 문제
  - 앱의 핵심 기능
  - 선택 사항: 소개 또는 사용 안내
- 제출 전 링크 형식이 올바른지 확인하고, 새 창에서 링크를 미리 열어볼 수 있어야 함.
- 공개 여부를 선택할 수 있어야 함.
- 공개를 선택한 산출물은 참가자들이 볼 수 있는 목록에 표시함.
- 목록에서 다른 참가자의 공유 페이지로 이동할 수 있어야 함.
- 사용자는 자신의 산출물을 수정하거나 삭제할 수 있어야 함.
- 외부 링크는 새 창에서 열리며, 외부 사이트로 이동한다는 점을 표시함.

### 4.5 댓글 및 피드백

- 로그인한 참가자가 공개된 산출물에 댓글을 작성할 수 있어야 함.
- 댓글에는 작성자의 닉네임과 작성 시각을 표시함.
- 댓글 작성자는 자신의 댓글을 수정하거나 삭제할 수 있어야 함.
- 산출물 소유자와 운영자는 부적절한 댓글을 삭제하거나 신고할 수 있어야 함.
- 이메일 등 계정의 비공개 정보는 댓글이나 산출물 페이지에 표시하지 않음.

## 5. 주요 화면

1. **로그인·계정 생성 화면**
2. **개인 작업 페이지**
   - 연수 과정 3단계와 진행 상태 표시
   - 각 단계로 이동하는 메뉴
3. **사전 과제 입력 화면**
4. **문제 정교화 및 PRD 작성 화면**
5. **MVP 링크 제출·수정 화면**
6. **공개 산출물 목록 화면**
7. **개별 산출물 상세 화면**
   - 앱 소개, 링크, 댓글 및 피드백

## 6. 완료 기준

- 참가자가 닉네임과 비밀번호로 계정을 만들고 다시 로그인할 수 있음.
- 닉네임 중복을 감지하고 다른 닉네임을 안내함.
- 사전 과제 내용을 저장하고 PRD 페이지에서 불러올 수 있음.
- Problem, User, Goal, Core features를 입력하고 수정할 수 있음.
- PRD를 화면에서 확인하고 Markdown 파일로 내려받을 수 있음.
- MVP 링크를 제출하고 공개 여부를 설정할 수 있음.
- 참가자가 공개된 다른 산출물을 열람하고 댓글을 작성할 수 있음.
- 비밀번호와 이메일 등 개인정보가 다른 참가자에게 노출되지 않음.

## 7. 초기 버전 범위

### 필수 구현

- 계정 생성 및 로그인
- 사전 과제 입력·저장
- 사전 과제 내용 불러오기
- PRD 작성·저장·미리보기
- Markdown 다운로드
- MVP 링크 제출 및 공개 목록
- 댓글 작성·삭제


## 8. 폰트
@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-1Thin.woff2') format('woff2');
    font-weight: 100;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-2ExtraLight.woff2') format('woff2');
    font-weight: 200;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-3Light.woff2') format('woff2');
    font-weight: 300;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-5Medium.woff2') format('woff2');
    font-weight: 500;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-6SemiBold.woff2') format('woff2');
    font-weight: 600;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-7Bold.woff2') format('woff2');
    font-weight: 700;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-8ExtraBold.woff2') format('woff2');
    font-weight: 800;
    font-display: swap;
}

@font-face {
    font-family: 'Paperozi';
    src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-9Black.woff2') format('woff2');
    font-weight: 900;
    font-display: swap;
}
### 후속 구현 가능 항목

- PRD AI 보완 기능
- 비밀번호 재설정 이메일
- 운영자용 관리 대시보드
- 댓글 신고 및 운영자 검토 기능
- 산출물 검색·분류 기능
- 다국어 화면 지원

**구현 시 참고:** 연수 시연용 MVP라면 처음부터 AI 보완 기능이나 복잡한 권한 체계를 넣기보다, 계정별 작업 저장과 PRD 다운로드, 링크 공유가 안정적으로 작동하는 것을 우선순위로 두는 것이 좋음. 이메일·비밀번호를 다루므로 인증과 저장 방식은 구현 단계에서 보안 검토가 필요함.
