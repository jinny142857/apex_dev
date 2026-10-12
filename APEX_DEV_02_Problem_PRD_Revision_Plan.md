# APEX DEV — 02 Problem & PRD 개편 계획서

## 목적

기존 02 단계는 사전 과제 문제 문장을 불러오고 곧바로 PRD를 작성한다. 참가자가 문제의 어느 순간을 앱으로 도울지 정하는 과정을 추가하고, 그 기록과 제작 지시문이 포함된 Markdown을 내려받게 한다. 50분 연수의 입력 부담을 최소화한다.

## 결정: B단계는 필수 질문 두 개

Pre-work에는 이미 WHO / TASK / SITUATION / ROOT CAUSE가 있다. 현재 업무 방식과 문제 원인을 다시 묻지 않는다.

1. **Focus moment — Which moment in this problem should the app help with first?**
   - 의미: 문제 전체 중 이번 첫 버전이 다룰 업무의 한 장면.
   - 짧은 예시: Finding out whose consent form is missing for an activity.
2. **Desired action — At that moment, what should the user be able to see or do in the app?**
   - 의미: 사용자가 앱에서 수행할 구체적인 행동. 기술명이나 기능 목록을 요구하지 않는다.
   - 짧은 예시: Select an activity and immediately see the missing forms.

두 답변은 각각 한 문장 정도로 안내한다. 이 두 질문이 각각 **범위 좁히기**와 **앱에서 가능한 행동 정하기**라는 서로 다른 역할을 하므로 유지한다. 별도의 Current workflow / Difficult moment / Result / Success criteria 입력란은 추가하지 않는다.

## 02 단계의 새 구조

| 내부 단계 | 화면과 동작 | 참가자가 새로 입력하는 내용 |
|---|---|---|
| A. My starting problem | 자신의 Pre-work 문장을 불러옴. 원문 보존, 정교화 문장은 수정 가능 | 필요한 경우에만 정교화 문장 |
| B. From problem to app idea | 위 두 질문, 각 항목에 라벨·짧은 도움말·별도 예시 보기 | Focus moment, Desired action |
| C. My PRD | Problem / User / Goal / Core features 필수, Design requirements 선택 | 제안된 초안을 확인·수정하고 기능 작성 |

상단에는 A → B → C의 진행 위치를 표시한다. 이전·다음 이동과 저장 후 재방문을 지원한다. 단계 잠금은 진행 안내 수준으로 유지하고, 기존 참가자의 저장 자료를 막지 않는다.

## 기존 자료와 새 입력 연결

- A의 원문은 Pre-work 게시물을 참조하고, 다운로드 문서에는 원문을 스냅샷으로 포함한다. 연수 중 수정한 정교화 문장은 별도로 저장한다.
- B의 두 답에서 앱 아이디어 문장을 미리보기로 제안한다. 예: A web app that helps teachers see missing consent forms for each activity. 문장은 참가자가 수정할 수 있지만 별도 필수 질문으로 만들지 않는다.
- C의 Problem에는 A의 정교화 문장, User에는 Pre-work의 WHO, Goal에는 B의 Desired action을 참고한 **수정 가능한 초안**을 제안한다. 자동 제안이 부정확할 수 있으므로 참가자 확인 없이 최종 확정하지 않는다.
- Core features는 참가자가 직접 1–3개 적는다. 각 기능은 Desired action을 가능하게 해야 한다. Design requirements는 선택이다.
- B의 Focus moment와 Desired action은 참가자의 산출물 상세 보기에서 문제→아이디어의 연결로 보여줄 수 있다. 기존 공유·수정·보관 규칙을 따른다.

## 다운로드 Markdown의 정확한 순서

맨 위에 제작 지시문을 두어 파일 전체를 AI 제작 도구에 붙여 넣기만 해도 요청 의도가 전달되게 한다. 배경 기록과 실제 구현 요구를 구분한다.

    # Build this web app

    Build a simple, working web app from the Product requirements below.
    Use the Starting point and From problem to app idea sections as context.
    Focus on one complete user workflow and implement the listed core features first.
    Use fictional sample data for the workshop demo. Do not use real student data.
    Avoid accounts, external services, and extra features unless the requirements explicitly need them.
    Make the interface clear for a first-time user. Use English unless a different language is specified.
    Make the main actions work; do not create a static mockup. Make reasonable assumptions and proceed.

    ## 1. Starting point
    - Original pre-work problem statement: [original]
    - Refined problem statement: [refined or original]

    ## 2. From problem to app idea
    - Focus moment: [answer]
    - Desired action: [answer]
    - App idea: [editable preview]

    ## 3. Product requirements
    - Problem: [text]
    - User: [text]
    - Goal: [text]
    - Core features:
      1. [feature]
      2. [feature]
    - Design requirements: [text, if supplied]

파일명에는 위험한 문자를 제거한 작품명 또는 참가자 식별용 짧은 이름을 사용한다. 디자인 요구가 비어 있으면 해당 줄을 생략한다. 원문은 맥락, Product requirements는 구현 기준임을 안내한다.

## 화면의 영어 문구

- A heading: My starting problem
- B heading: From problem to app idea
- B help: Choose one moment and one action for your first app.
- B first field label: Which moment in this problem should the app help with first?
- B second field label: At that moment, what should the user be able to see or do in the app?
- App idea preview label: Your app idea (you can edit this)
- C heading: My PRD
- Download button: Download build-ready PRD (.md)

한국어 UI도 같은 의미로 번역하되 영문 필드명과 출력 구조는 강의 자료와 일치시킨다. 예시 문구는 placeholder에만 의존하지 않고 필드 옆의 View example에서 보인다.

## 데이터와 이전 글 처리

- 현재 PRD와 Pre-work 저장 구조를 먼저 확인하고 기존 필드는 보존한다. B단계 답과 정교화 문장은 새 필드로 추가한다.
- 이미 작성된 PRD는 그대로 열리고 다운로드되어야 한다. B단계 값이 없는 과거 글에는 빈 항목을 강제로 채우지 않으며, 편집할 때 답을 추가할 수 있게 한다.
- 원문 Pre-work가 이후 수정돼도 이미 다운로드한 파일은 바뀌지 않는다. 새로 다운로드하면 현재 저장된 연결값을 사용한다.
- 입력 중 임시 저장 또는 단계 전환 시 저장을 제공하고, 저장 실패는 화면에 알린다. 참가자 본인의 자료만 편집 가능해야 한다.
- 개인정보 수집 범위를 늘리지 않는다. 앱 제작 시연에는 가상 학생 자료를 사용한다.

## 완료 검증

1. 새 참가자가 Pre-work를 작성하고 A → B → C를 채운 후 새로고침해도 입력이 남는다.
2. 두 질문을 작성하면 앱 아이디어 미리보기가 보이며 수정한 문장도 저장된다.
3. 내려받은 Markdown의 맨 위에 Build this web app 지시문이 있고, 문제 정의·두 답·PRD가 올바른 순서로 있다.
4. Goal 자동 제안과 Core features 입력이 별개이며, 사용자가 제안을 수정할 수 있다.
5. 기존에 작성한 PRD가 새 필드가 비어 있어도 열리고 수정·다운로드된다.
6. 다른 참가자 계정으로는 이 작성물을 편집할 수 없다.
7. 한국어·영어 UI와 다운로드 내용에서 필드의 의미가 일치한다.

## 구현 순서

1. 현재 코드의 02 페이지, PRD 저장 모델, Markdown 생성 함수, 공유 화면, 번역 문자열을 확인한다.
2. 새 필드와 기존 자료 호환을 반영한다.
3. A/B/C 화면과 저장·미리보기를 연결한다.
4. Markdown 생성 함수를 위 구조로 변경한다.
5. 실제 참가자 계정과 과거 작성물로 완료 검증을 한다.
