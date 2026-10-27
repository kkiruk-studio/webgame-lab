# webgame-lab

## 목적
웹 게임 프로토타입 랩. 핸드폰 Claude 앱(Remote Control)에서 지시 → Mac이 수정 → GitHub Pages로 확인하는 루프. 코어 루프 검증용이며, 본 제작은 검증 후 Swift+SpriteKit 또는 Unity로 옮긴다.

## 구조
- `index.html` — 랩 인덱스 (프로토타입 목록)
- `games/<slug>/index.html` — 게임 하나당 폴더 하나, 단일 HTML 권장
- `deploy.sh` — 커밋·푸시

## 배포 규칙 (필수)
- 파일을 바꾸면 **묻지 말고 즉시** `./deploy.sh "<요약>"` 로 커밋·푸시한다.
- 사용자는 핸드폰 데이터망에서 사파리로 확인하므로 로컬 서버는 의미가 없다.
- 푸시 후 30초~2분 뒤 `curl -s -o /dev/null -w '%{http_code}' <URL>` 로 200을 확인하고 URL을 사용자에게 준다.
- URL 패턴: `https://kkiruk-studio.github.io/webgame-lab/games/<slug>/`
- 로컬 js/css 는 `?v=0` 식 버전 쿼리를 붙여 두면 deploy.sh 가 타임스탬프로 바꿔 캐시 섞임을 막는다(Pages max-age 600). 새 게임도 같은 형식으로.

## 새 게임 추가 절차
1. `games/<slug>/index.html` 생성
2. 루트 `index.html` 목록에 링크 추가
3. 배포
4. 위키 `pages/games/<slug>.md` 생성(상태 "프로토타입") + `index.md` 게임 표 행 + `log.md` append (전역 CLAUDE.md 위키 규칙 그대로)

## 모바일 제약
- 세로 모드 기본, `viewport-fit=cover` + safe-area, `touch-action:none`, `100dvh`, dpr 반영 캔버스
- 외부 CDN 의존 금지 (오프라인·데이터망 고려)
- 단일 HTML 1파일 권장. 에셋은 절차적 생성 또는 인라인 SVG/data URI
- 오디오는 첫 터치 이후에만 재생 시작 (iOS 자동재생 제한)

## 금지
- 이 레포는 www.kkirukstudio.com과 무관한 실험용이다. 스토어 URL·랜딩을 여기에 두지 않는다.
- 빌드 도구·npm 도입 금지.

## 검증 기준
핸드폰 사파리에서 스크롤/바운스/줌 없이 풀스크린, 터치 반응, 60fps 근처.
