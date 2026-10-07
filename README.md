# APEX DEV

APEX DEV 연수용 웹앱입니다. Next.js와 Firebase를 사용하며, 계정 인증은 Firebase Authentication, 참가자 데이터는 Cloud Firestore, 관리자 권한은 Firebase custom claim으로 처리합니다. 상단의 한국어/English 전환은 메뉴·안내 문구에만 적용하며 참가자가 작성한 원문은 번역하거나 변경하지 않습니다.

## Firebase 설정

1. Firebase 프로젝트를 만든 뒤 **Authentication → Email/Password**와 **Cloud Firestore**를 활성화합니다. Firestore는 Production mode로 생성합니다.
2. `.env.example` 파일을 `.env.local`로 복사한 뒤 Firebase 웹 앱 설정값과 Admin SDK 설정값을 입력합니다. `.env.local`은 절대 커밋하지 않습니다.
3. Firebase Console의 Firestore Rules에서 **기존 규칙을 먼저 백업**합니다. 이 Firebase 프로젝트에 다른 앱의 `apps` 컬렉션도 있으므로 [`firestore.rules`](./firestore.rules)의 SchoolLab 관련 `match` 블록을 기존 규칙 안에 병합한 뒤 게시합니다. 파일 전체로 기존 규칙을 덮어쓰면 다른 앱의 접근 권한이 사라질 수 있습니다.
4. 아래 명령으로 로컬 개발 서버를 실행합니다.

```bash
npm install
npm run dev
```

## 환경변수

`.env.example`의 모든 항목을 설정해야 합니다.

- `NEXT_PUBLIC_FIREBASE_*`: Firebase Console → Project settings → Your apps에서 확인하는 웹 앱 설정값입니다.
- `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: Firebase Console → Project settings → Service accounts에서 Admin SDK 비공개 키를 생성해 입력합니다.
- `ADMIN_NICKNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: 처음 생성할 관리자 계정 정보입니다.
- `ADMIN_SETUP_SECRET`: 관리자 생성 API를 보호하는 충분히 긴 임의의 비밀값입니다.

## 첫 관리자 계정 만들기

Vercel 배포 후 아래 요청을 **한 번만** 실행합니다. URL과 비밀값을 실제 값으로 바꾸세요.

```bash
curl -X POST https://YOUR-VERCEL-URL/api/admin/bootstrap \
  -H "x-setup-secret: YOUR_ADMIN_SETUP_SECRET"
```

이 요청은 환경변수의 `ADMIN_NICKNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`로 Firebase 계정을 만들거나 기존 계정의 닉네임·비밀번호를 해당 값으로 갱신합니다. Firebase `admin` custom claim을 부여하고, 처음 생성할 때만 참가자 화면에 Pre-work만 열리도록 설정합니다. 또한 사전 과제 Markdown의 예시 문장을 관리자 이름의 공개 글로 한 번 등록합니다. 다시 실행해도 운영 중인 메뉴 공개 설정이나 이미 등록된 예시 글은 덮어쓰지 않습니다. 관리자 계정으로 로그인한 상태였다면 로그아웃 후 다시 로그인하여 권한 정보를 갱신하세요.

## Vercel 배포

1. Vercel에서 이 저장소를 Import합니다.
2. Project Settings → Environment Variables에 `.env.example`의 모든 값을 등록합니다.
3. Preview 배포도 사용할 경우 Preview와 Production 환경 모두에 Firebase 설정값을 넣습니다.
4. 배포 후 위의 관리자 생성 요청을 실행합니다.

Firebase Spark 무료 플랜은 15명 안팎의 연수 운영에 필요한 Authentication 및 Firestore 사용량에 충분합니다. 참가자 수와 댓글·저장 횟수가 크게 증가하지 않는 한 Neon으로 바꿀 필요는 없습니다.

## 운영 기능

- **Admin** 메뉴는 환경변수로 생성한 관리자만 사용할 수 있습니다.
- 로그인 후 **Home**에는 연수 전 과제 제출·설문 응답 안내와 두 개의 바로가기 버튼만 보입니다. 단계별 메뉴는 상단에 유지하며, 초기 설정상 참가자는 Pre-work만 이용할 수 있습니다. 아직 비공개인 단계를 누르면 연수 당일에 열린다는 안내가 표시됩니다. 관리자는 항상 모든 단계에 접근할 수 있습니다.
- 단계는 **00 Pre-work → 01 Vibe coding warm-up → 02 Refine the problem & write a PRD → 03 Final outcomes → 04 Presentation & Evaluation** 순서입니다. **Survey**는 사전 준비용으로 Home 옆에 배치했습니다. 관리자는 각 단계의 참가자 공개 여부를 조절할 수 있습니다.
- 각 단계에서 참가자가 글을 게시하면 로그인한 연수 참가자 모두가 해당 단계의 공유 목록에서 읽고 피드백을 남길 수 있습니다. 게시 전 화면에 공유 사실을 표시합니다.
- Pre-work는 글 목록을 먼저 보여주며, **New post**를 누르면 과제 안내와 문제 진술 입력란을 나란히 표시합니다.
- Warm-up에는 따라 만든 결과의 제목과 링크 또는 짧은 설명을 제출합니다. 최종 산출물과는 별도 목록으로 표시합니다.
- 계정의 첫 Pre-work 방문에는 과제 안내가 팝업으로 열립니다. 닫은 기록은 계정에 저장되며, 이후에는 목록의 **Guide** 버튼으로 언제든 다시 볼 수 있습니다. 작성 화면에서는 왼쪽 안내문을 사용하므로 **Guide** 버튼을 숨깁니다.
- 관리자는 참가자의 닉네임을 바꾸거나 비밀번호를 재설정하고, 모든 단계의 게시글을 수정·삭제할 수 있습니다.
- Pre-work 화면의 안내문은 `public/content/problem-statement-assignment.md`에서 읽습니다. 이 파일을 수정해도 참가자가 이미 저장한 답변은 변경되지 않습니다.

## 설문과 평가 운영

- **Survey**에서 관리자는 **Add recommended survey** 버튼으로 AI 도구 사용·유료 구독 여부를 묻는 기본 설문을 한 번만 추가할 수 있습니다. 이 동작은 이미 만든 설문이나 응답을 덮어쓰지 않으며, 기본 마감은 생성 시점으로부터 14일 후입니다. 다른 주제의 자유서술형·단일선택형 설문도 만들 수 있습니다. 참가자는 마감 전까지 답변을 제출·수정하며, 응답 내용은 관리자 화면에만 표시됩니다. 관리자는 설문을 조기 종료할 수 있습니다.

## 운영 데이터 보호

- 운영 데이터는 Firestore의 `prework`, `prds`, `projects`, `users`, `apexDevSurveys`, `apexDevEvaluation`, `apexDevTeamRepresentatives`, `apexDevFinalScores`에 보관됩니다. 기본 설문 생성과 관리자 초기 설정은 존재하는 문서를 삭제하거나 초기화하지 않습니다.
- 운영 중에는 Firebase Console에서 컬렉션을 삭제하거나, Firestore 규칙을 파일 전체로 덮어쓰지 마세요. 배포 전에는 Firestore의 기존 규칙을 백업하고 SchoolLab 관련 규칙만 병합합니다.
- 연수 시작 전 Firebase/Google Cloud의 Firestore 내보내기 또는 백업 정책을 한 번 설정해 두면, 실수로 인한 데이터 변경에도 더 안전합니다.

## 목업 미리보기

로그인 화면의 **Demo mode**를 누르고 비밀번호 `2026`을 입력하면 목업 화면을 확인할 수 있습니다. 배포 후에도 배포 주소의 로그인 화면에서 같은 방식으로 진입합니다. 이 미리보기에는 15명의 가상 참가자, Pre-work·Warm-up·PRD 게시글, 15개의 개별 산출물과 4팀 대표작, 설문, 발표 모드, 평가 팝업, 시상식, 관리자 화면이 들어 있습니다. 상단에서 참가자/관리자 보기를 바꾸고, 발표·평가 화면에서는 팀 공유·최종 발표·시상 단계를 전환할 수 있습니다. 목업에서 입력·채점·댓글을 시험해도 **Firebase에는 저장되지 않으며**, 새로고침하면 원래 예시 상태로 돌아갑니다. 실제 운영 데이터는 로그인 후 본 앱에서 따로 관리합니다.
- 모든 참가자가 **Final outcomes**에 개별 산출물을 제출합니다. 갤러리에서 작품을 열람하고, **Presentation mode**로 전환해 앞뒤 작품을 넘기며 웹사이트 미리보기·설명·댓글을 함께 볼 수 있습니다. 외부 사이트가 iframe 미리보기를 차단하면 **Open site**로 새 탭에서 열 수 있습니다.
- **Presentation & Evaluation**에서 관리자는 참가자를 A~D 네 팀에 배정합니다. 모든 참가자는 개별 산출물을 제출하고, 팀 안에서 발표·공유하며 협의합니다. 이 단계에는 점수 평가가 없습니다. **팀원이 직접 합의한 산출물 하나를 대표작으로 제출**하며, 관리자는 이를 대신 선정하지 않습니다. 최종 평가를 열기 전까지 같은 팀원이 제출 내용을 변경할 수 있으므로 팀 안에서 먼저 합의해야 합니다.
- 최종 평가에서는 팀 대표 4명의 산출물을 발표 모드에서 보여줍니다. 왼쪽은 작품 목록, 가운데는 웹앱 미리보기·소개, 오른쪽은 댓글입니다. **Rate this pitch**를 누르면 별도 팝업에서 루브릭 점수를 매깁니다. 참가자는 자기 팀을 제외한 다른 팀 대표를 평가합니다. 관리자가 공식 루브릭 항목·최대 점수와 마감 시각을 설정합니다. 평가표는 한 번 제출하면 수정할 수 없습니다. 평가 인원 차이를 고려해 평균 점수로 우승 팀을 정하고, 동점은 관리자가 결정합니다.
- 점수와 전체 순위는 관리자에게만 보입니다. 관리자가 확정·공개한 후 참가자에게는 팀 대표와 최종 우승 팀만 보이고 개인 점수·등수는 표시되지 않습니다. **Launch award ceremony**로 우승 팀 전체를 위한 발표 화면을 띄울 수 있습니다.
- 설문 응답·팀 대표작·최종 평가 점수는 서버 API에서 로그인 정보, 마감 시각, 소속 팀, 산출물 소유 팀, 채점 대상, 점수 범위, 중복 제출 여부를 검사합니다. 데이터는 `apexDevSurveys`, `apexDevEvaluation`, `apexDevTeamRepresentatives`, `apexDevFinalScores` 컬렉션에 별도로 저장되며, 클라이언트 Firestore 규칙을 추가하지 않아도 동작합니다. 기존 앱의 Firestore 규칙은 README 상단 안내에 따라 유지하세요.
