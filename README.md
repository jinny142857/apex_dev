# APEX SchoolLab

APEX SchoolLab 연수용 웹앱입니다. Next.js와 Firebase를 사용하며, 계정 인증은 Firebase Authentication, 참가자 데이터는 Cloud Firestore, 관리자 권한은 Firebase custom claim으로 처리합니다. 웹앱의 참가자용 화면 문구는 영어로 유지합니다.

## Firebase 설정

1. Firebase 프로젝트를 만든 뒤 **Authentication → Email/Password**와 **Cloud Firestore**를 활성화합니다. Firestore는 Production mode로 생성합니다.
2. `.env.example` 파일을 `.env.local`로 복사한 뒤 Firebase 웹 앱 설정값과 Admin SDK 설정값을 입력합니다. `.env.local`은 절대 커밋하지 않습니다.
3. Firebase Console의 Firestore Rules에 [`firestore.rules`](./firestore.rules) 내용을 붙여 넣고 배포합니다.
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

이 요청은 환경변수의 `ADMIN_NICKNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`로 Firebase 계정을 만들거나 기존 계정을 관리자 권한으로 승격합니다. Firebase `admin` custom claim을 부여하고, 참가자 화면에는 Pre-work만 열리도록 초기 상태를 설정합니다. 관리자 계정으로 로그인한 상태였다면 로그아웃 후 다시 로그인하여 권한 정보를 갱신하세요.

## Vercel 배포

1. Vercel에서 이 저장소를 Import합니다.
2. Project Settings → Environment Variables에 `.env.example`의 모든 값을 등록합니다.
3. Preview 배포도 사용할 경우 Preview와 Production 환경 모두에 Firebase 설정값을 넣습니다.
4. 배포 후 위의 관리자 생성 요청을 실행합니다.

Firebase Spark 무료 플랜은 15명 안팎의 연수 운영에 필요한 Authentication 및 Firestore 사용량에 충분합니다. 참가자 수와 댓글·저장 횟수가 크게 증가하지 않는 한 Neon으로 바꿀 필요는 없습니다.

## 운영 기능

- **Admin** 메뉴는 환경변수로 생성한 관리자만 사용할 수 있습니다.
- 관리자는 Pre-work, PRD, MVP 공유 메뉴를 참가자에게 열거나 숨길 수 있습니다. 메뉴를 숨겨도 관리자는 모든 화면을 계속 볼 수 있습니다.
- 관리자는 참가자의 닉네임을 바꾸거나 비밀번호를 재설정하고, 모든 MVP 제출물을 수정·삭제할 수 있습니다.
- Pre-work 화면의 안내문은 `public/content/problem-statement-assignment.md`에서 읽습니다. 이 파일을 수정해도 참가자가 이미 저장한 답변은 변경되지 않습니다.
