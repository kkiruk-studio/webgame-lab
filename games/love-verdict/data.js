/* 오늘의 연애판결 — 데이터 레이어
 * (a) LV.seedStories : 시드 사연
 * (b) LV.repo        : 저장소 어댑터. 지금은 localStorage, 나중에 Supabase/Firebase 로 교체.
 * 모든 repo 함수는 Promise 를 반환한다 → 네트워크로 바꿔도 app.js 는 그대로.
 * UI 코드 없음.
 */
window.LV = window.LV || {};

LV.seedStories = [
  {
    id: "s001", category: "연락", title: "카톡 답장이 하루에 세 번",
    body: "사귄 지 8개월. 남친이 회사 바쁘다고 답장을 점심, 퇴근, 자기 전 딱 세 번만 해요. 근데 인스타 스토리는 낮에도 올라와요. 서운하다고 하니까 '연락 횟수로 사랑 재지 마'래요.",
    question: "제가 예민한 걸까요?",
    options: [
      { key: "a", label: "예민한 거 아니다, 서운할 만하다", traits: { fairness: 2, romantic: 1 } },
      { key: "b", label: "좀 예민하다, 바쁠 수 있다", traits: { independence: 2, patience: 1 } }
    ],
    votes: { a: 8861, b: 3620 },
    followUp: {
      question: "누가 더 잘못했나요?",
      options: [ { key: "a", label: "남친" }, { key: "b", label: "글쓴이" }, { key: "both", label: "둘 다" }, { key: "none", label: "아무도" } ],
      votes: { a: 5120, b: 2100, both: 3900, none: 1361 }
    },
    createdAt: "2026-10-12T09:00:00+09:00"
  },
  {
    id: "s002", category: "전 연인", title: "전 여친 생일에 축하 문자",
    body: "여친이 전 남친 생일이라고 '생일 축하해' 카톡을 보냈대요. 숨긴 것도 아니고 먼저 말해줬어요. 5년 사귄 사이라 그 정도는 예의라는데 저는 좀 찝찝합니다.",
    question: "이거 괜찮은 건가요?",
    options: [
      { key: "a", label: "선 넘었다", traits: { trust: 2, fairness: 1 } },
      { key: "b", label: "먼저 말했으면 괜찮다", traits: { trust: 1, independence: 2 } }
    ],
    votes: { a: 14210, b: 6033 },
    followUp: {
      question: "글쓴이는 어떻게 해야 할까요?",
      options: [ { key: "a", label: "솔직히 싫다고 말한다" }, { key: "b", label: "그냥 넘어간다" }, { key: "both", label: "규칙을 같이 정한다" }, { key: "none", label: "헤어진다" } ],
      votes: { a: 7120, b: 2210, both: 9800, none: 1113 }
    },
    createdAt: "2026-10-11T21:10:00+09:00"
  },
  {
    id: "s003", category: "이성 친구", title: "여사친이랑 단둘이 영화",
    body: "남친한테 10년 된 여사친이 있어요. 둘이 개봉 영화 보러 간다는데 저도 같이 가자니까 '너 그 장르 싫어하잖아'래요. 맞긴 한데 기분이 묘해요.",
    question: "단둘이 영화, 허용 가능?",
    options: [
      { key: "a", label: "안 된다", traits: { trust: 2 } },
      { key: "b", label: "친구면 괜찮다", traits: { independence: 2, trust: 1 } }
    ],
    votes: { a: 21044, b: 9310 },
    createdAt: "2026-10-12T13:30:00+09:00"
  },
  {
    id: "s004", category: "데이트 비용", title: "데이트 통장 7:3 제안",
    body: "남친 연봉이 저보다 두 배 정도 높아요. 데이트 통장을 반반 하다가 제가 7:3으로 하자고 했더니 표정이 굳더라고요. 저는 합리적이라고 생각했는데요.",
    question: "7:3 제안, 합리적인가요?",
    options: [
      { key: "a", label: "합리적이다", traits: { practical: 2 } },
      { key: "b", label: "반반이 맞다", traits: { fairness: 2 } }
    ],
    votes: { a: 5402, b: 7790 },
    followUp: {
      question: "남친 반응은?",
      options: [ { key: "a", label: "서운할 만하다" }, { key: "b", label: "쪼잔하다" }, { key: "both", label: "대화로 풀 문제" }, { key: "none", label: "관심 없음" } ],
      votes: { a: 3120, b: 2480, both: 6900, none: 692 }
    },
    createdAt: "2026-10-10T19:00:00+09:00"
  },
  {
    id: "s005", category: "결혼", title: "결혼 얘기만 나오면 회피",
    body: "4년 연애, 둘 다 서른 넘었어요. 결혼 얘기를 꺼내면 '때 되면 하자'면서 화제를 돌려요. 집, 돈 계획을 물어보면 아직 모르겠대요.",
    question: "계속 기다려야 할까요?",
    options: [
      { key: "a", label: "기한 정하고 결론 낸다", traits: { practical: 2, independence: 1 } },
      { key: "b", label: "조금 더 기다린다", traits: { patience: 2, romantic: 1 } }
    ],
    votes: { a: 18820, b: 4105 },
    followUp: {
      question: "기한을 정한다면?",
      options: [ { key: "a", label: "3개월" }, { key: "b", label: "6개월" }, { key: "both", label: "1년" }, { key: "none", label: "기한 없이 대화" } ],
      votes: { a: 6120, b: 8340, both: 3210, none: 5255 }
    },
    createdAt: "2026-10-09T08:20:00+09:00"
  },
  {
    id: "s006", category: "부모님", title: "명절마다 우리 집 먼저",
    body: "결혼 2년 차예요. 남편이 매번 시댁 먼저 가고 처가는 다음 날 점심만 먹고 와요. 올해는 바꾸자니까 '어머니가 서운해하셔'래요.",
    question: "올해는 처가 먼저가 맞나요?",
    options: [
      { key: "a", label: "번갈아 가는 게 맞다", traits: { fairness: 2 } },
      { key: "b", label: "남편 입장도 이해된다", traits: { patience: 2 } }
    ],
    votes: { a: 25530, b: 3210 },
    followUp: {
      question: "누가 먼저 말해야 할까요?",
      options: [ { key: "a", label: "남편이 시댁에" }, { key: "b", label: "아내가 직접" }, { key: "both", label: "둘이 같이" }, { key: "none", label: "말 안 하고 그냥 간다" } ],
      votes: { a: 15200, b: 1900, both: 9800, none: 1840 }
    },
    createdAt: "2026-10-08T10:00:00+09:00"
  },
  {
    id: "s007", category: "장거리", title: "서울-부산, 매번 내가 내려감",
    body: "장거리 1년째. 한 달에 두 번 보는데 거의 제가 KTX 타고 내려가요. 여친은 주말에 알바가 있어서 어렵다는데 교통비가 한 달에 20만 원 넘게 나가요.",
    question: "이대로 괜찮을까요?",
    options: [
      { key: "a", label: "번갈아 와야 한다", traits: { fairness: 2 } },
      { key: "b", label: "사정 있으면 감수한다", traits: { romantic: 2, patience: 1 } }
    ],
    votes: { a: 6630, b: 2215 },
    createdAt: "2026-10-12T07:45:00+09:00"
  },
  {
    id: "s008", category: "SNS", title: "커플 사진 안 올리는 남친",
    body: "사귄 지 1년인데 남친 인스타에 제 흔적이 하나도 없어요. 친구들이랑 찍은 건 잘 올리면서요. 물어보니 '사생활 올리는 거 안 좋아해'래요.",
    question: "서운해도 되는 일인가요?",
    options: [
      { key: "a", label: "서운할 만하다", traits: { romantic: 2 } },
      { key: "b", label: "취향 차이다", traits: { independence: 2 } }
    ],
    votes: { a: 9120, b: 10440 },
    followUp: {
      question: "남친은 어떻게 해야 할까요?",
      options: [ { key: "a", label: "한 장이라도 올린다" }, { key: "b", label: "지금처럼" }, { key: "both", label: "스토리 정도는" }, { key: "none", label: "계정 비공개" } ],
      votes: { a: 4200, b: 5900, both: 8100, none: 1360 }
    },
    createdAt: "2026-10-11T12:00:00+09:00"
  },
  {
    id: "s009", category: "휴대폰", title: "폰 비밀번호 공유하자는 여친",
    body: "여친이 서로 폰 비번을 알자고 해요. 숨길 건 없는데 그냥 내 공간이 사라지는 느낌이 싫어요. 거절하니까 '뭐 숨기는 거 있어?'래요.",
    question: "비밀번호 공유, 해야 할까요?",
    options: [
      { key: "a", label: "공유해도 된다", traits: { trust: 2 } },
      { key: "b", label: "안 해도 된다", traits: { independence: 2 } }
    ],
    votes: { a: 7302, b: 12901 },
    createdAt: "2026-10-10T22:40:00+09:00"
  },
  {
    id: "s010", category: "집안일", title: "설거지는 하는데 개수대는 안 닦음",
    body: "맞벌이 신혼이에요. 남편이 설거지는 하는데 개수대 음식물이랑 물기는 그대로 둬요. 말하면 '했잖아'라고 하고요. 결국 제가 마무리해요.",
    question: "이건 설거지를 한 건가요?",
    options: [
      { key: "a", label: "반만 한 거다", traits: { fairness: 2, practical: 1 } },
      { key: "b", label: "한 건 한 거다", traits: { patience: 2 } }
    ],
    votes: { a: 16210, b: 2840 },
    createdAt: "2026-10-12T20:15:00+09:00"
  },
  {
    id: "s011", category: "기념일", title: "100일을 까먹은 남친",
    body: "100일에 아무 연락이 없어서 기다리다가 밤 11시에 제가 먼저 말했어요. 남친은 '아 맞다 미안' 하고 다음 날 케이크 사왔어요. 마음이 안 풀려요.",
    question: "용서해도 될까요?",
    options: [
      { key: "a", label: "한 번은 봐준다", traits: { patience: 2, romantic: 1 } },
      { key: "b", label: "확실히 짚고 넘어간다", traits: { fairness: 2 } }
    ],
    votes: { a: 11050, b: 6720 },
    followUp: {
      question: "누가 더 잘못했나요?",
      options: [ { key: "a", label: "남친" }, { key: "b", label: "글쓴이" }, { key: "both", label: "둘 다" }, { key: "none", label: "아무도" } ],
      votes: { a: 12020, b: 1100, both: 2900, none: 1750 }
    },
    createdAt: "2026-10-07T18:00:00+09:00"
  },
  {
    id: "s012", category: "술자리", title: "회식 끝나고 새벽 3시 귀가",
    body: "여친이 회식이라며 12시까지 들어간다더니 새벽 3시에 연락 왔어요. 그 사이에 폰이 꺼져 있었고요. 다음 날 '2차 가느라 정신없었어'래요.",
    question: "화낼 만한 일인가요?",
    options: [
      { key: "a", label: "화낼 만하다", traits: { trust: 2 } },
      { key: "b", label: "회식이면 그럴 수 있다", traits: { patience: 1, independence: 2 } }
    ],
    votes: { a: 19030, b: 4402 },
    followUp: {
      question: "가장 문제인 건?",
      options: [ { key: "a", label: "늦은 시간" }, { key: "b", label: "폰 꺼둔 것" }, { key: "both", label: "둘 다" }, { key: "none", label: "문제없음" } ],
      votes: { a: 2210, b: 11080, both: 8790, none: 1352 }
    },
    createdAt: "2026-10-12T02:50:00+09:00"
  },
  {
    id: "s013", category: "직장 동료", title: "퇴근길에 동료 차 얻어 탐",
    body: "남친이 같은 방향 사는 여자 동료 차를 매일 얻어 타고 퇴근해요. 기름값은 반반 낸대요. 지하철로 40분이면 오는 거리예요.",
    question: "카풀, 그만두라고 해도 될까요?",
    options: [
      { key: "a", label: "그만두라 해도 된다", traits: { trust: 2 } },
      { key: "b", label: "현실적인 선택이다", traits: { practical: 2 } }
    ],
    votes: { a: 13490, b: 5150 },
    followUp: {
      question: "가장 걸리는 건?",
      options: [ { key: "a", label: "매일이라는 점" }, { key: "b", label: "단둘이라는 점" }, { key: "both", label: "둘 다" }, { key: "none", label: "별로 안 걸림" } ],
      votes: { a: 3100, b: 5400, both: 8200, none: 1940 }
    },
    createdAt: "2026-10-06T08:30:00+09:00"
  },
  {
    id: "s014", category: "게임", title: "데이트 중에도 폰 게임",
    body: "남친이 카페에서도 식당에서도 틈나면 모바일 게임을 해요. '이벤트 기간이라 출석만'이라는데 30분씩 걸려요. 제가 말 걸면 잠깐만 하고요.",
    question: "게임 금지령, 과한가요?",
    options: [
      { key: "a", label: "데이트 땐 금지가 맞다", traits: { romantic: 1, fairness: 2 } },
      { key: "b", label: "금지는 과하다, 시간만 줄이자", traits: { practical: 1, patience: 2 } }
    ],
    votes: { a: 7720, b: 6610 },
    createdAt: "2026-10-12T16:00:00+09:00"
  },
  {
    id: "s015", category: "여행", title: "첫 해외여행 일정 싸움",
    body: "여친은 하루에 스팟 8곳을 도는 계획파, 저는 숙소에서 늘어지는 휴양파예요. 3박 4일 오사카 일정 짜다가 크게 싸웠어요.",
    question: "누구 방식이 맞나요?",
    options: [
      { key: "a", label: "반반 섞는다", traits: { fairness: 2 } },
      { key: "b", label: "따로 다니는 시간을 만든다", traits: { independence: 2 } }
    ],
    votes: { a: 3320, b: 2210 },
    followUp: {
      question: "이 커플, 같이 여행 다녀도 될까요?",
      options: [ { key: "a", label: "충분히 맞춰간다" }, { key: "b", label: "여행은 따로" }, { key: "both", label: "짧게만" }, { key: "none", label: "모르겠다" } ],
      votes: { a: 2400, b: 900, both: 1700, none: 530 }
    },
    createdAt: "2026-10-05T11:00:00+09:00"
  },
  {
    id: "s016", category: "동거", title: "동거 제안, 부모님께 말할까",
    body: "2년 사귄 남친이 월세 아끼게 같이 살자고 해요. 저도 좋긴 한데 부모님은 보수적이에요. 남친은 '굳이 말할 필요 있어?'라고 하고요.",
    question: "부모님께 말하고 동거해야 할까요?",
    options: [
      { key: "a", label: "말하고 한다", traits: { trust: 2 } },
      { key: "b", label: "일단 둘이 결정한다", traits: { independence: 2, practical: 1 } }
    ],
    votes: { a: 4410, b: 6250 },
    createdAt: "2026-10-04T23:00:00+09:00"
  },
  {
    id: "s017", category: "질투", title: "헬스 트레이너한테 질투",
    body: "여친이 PT를 받는데 트레이너가 남자예요. 운동 끝나고 카톡으로 식단 사진을 보내고 피드백을 받는대요. 일인데 자꾸 신경 쓰여요.",
    question: "제가 질투하는 게 이상한가요?",
    options: [
      { key: "a", label: "이상하다, 일이다", traits: { trust: 2, independence: 1 } },
      { key: "b", label: "신경 쓰일 만하다", traits: { romantic: 2 } }
    ],
    votes: { a: 15880, b: 4320 },
    createdAt: "2026-10-12T22:10:00+09:00"
  },
  {
    id: "s018", category: "친구 관계", title: "내 친구 험담하는 남친",
    body: "남친이 제 친한 친구를 '좀 가볍다'고 계속 말해요. 친구가 소개팅 얘기를 자주 해서 그렇대요. 그 친구 만나고 오면 꼭 한마디씩 해요.",
    question: "남친한테 그만하라고 해야 할까요?",
    options: [
      { key: "a", label: "단호하게 선 긋는다", traits: { fairness: 2, independence: 1 } },
      { key: "b", label: "남친 걱정도 들어본다", traits: { patience: 2 } }
    ],
    votes: { a: 12020, b: 2610 },
    followUp: {
      question: "누가 더 잘못했나요?",
      options: [ { key: "a", label: "남친" }, { key: "b", label: "친구" }, { key: "both", label: "둘 다" }, { key: "none", label: "아무도" } ],
      votes: { a: 9800, b: 820, both: 2100, none: 1910 }
    },
    createdAt: "2026-10-03T15:00:00+09:00"
  },
  {
    id: "s019", category: "연락", title: "읽씹 후 다음 날 '자고 있었어'",
    body: "저녁 9시에 보낸 카톡을 읽고 답이 없었어요. 다음 날 아침에 '어제 너무 피곤해서 자버렸어'래요. 읽고 잔 건데 한 줄도 못 보내나 싶어요.",
    question: "서운하다고 말해도 될까요?",
    options: [
      { key: "a", label: "말해도 된다", traits: { fairness: 1, romantic: 2 } },
      { key: "b", label: "넘어가도 될 일이다", traits: { patience: 2 } }
    ],
    votes: { a: 2940, b: 1880 },
    createdAt: "2026-10-12T10:40:00+09:00"
  },
  {
    id: "s020", category: "데이트 비용", title: "생일 선물 가격 차이",
    body: "제 생일에 남친이 30만 원짜리 지갑을 줬어요. 남친 생일에 저는 7만 원짜리 향수를 줬는데, 지나가는 말로 '나는 좀 신경 썼는데' 하더라고요.",
    question: "선물 가격 맞춰야 하나요?",
    options: [
      { key: "a", label: "어느 정도 맞춰야 한다", traits: { fairness: 2 } },
      { key: "b", label: "형편대로 하면 된다", traits: { practical: 2 } }
    ],
    votes: { a: 3810, b: 9920 },
    createdAt: "2026-10-02T20:00:00+09:00"
  },
  {
    id: "s021", category: "전 연인", title: "전 남친이 준 커플링 보관",
    body: "여친 서랍에서 전 남친이랑 맞춘 반지를 발견했어요. 버리기 아까워서 둔 거래요. 금이라 나중에 팔 거라고 하네요.",
    question: "버려 달라고 해도 될까요?",
    options: [
      { key: "a", label: "처분하라고 해도 된다", traits: { trust: 1, romantic: 2 } },
      { key: "b", label: "금이면 이해된다", traits: { practical: 2 } }
    ],
    votes: { a: 6230, b: 8840 },
    createdAt: "2026-10-12T18:30:00+09:00"
  },
  {
    id: "s022", category: "부모님", title: "엄마가 남친 직업을 반대",
    body: "남친이 프리랜서 디자이너예요. 엄마가 '안정적인 사람 만나라'고 매번 말씀하세요. 남친도 그걸 알고 저희 집에 인사 오는 걸 피해요.",
    question: "어떻게 해야 할까요?",
    options: [
      { key: "a", label: "내 선택을 밀고 간다", traits: { independence: 2, romantic: 1 } },
      { key: "b", label: "엄마 말도 일리 있다", traits: { practical: 2 } }
    ],
    votes: { a: 10450, b: 3010 },
    createdAt: "2026-10-01T09:30:00+09:00"
  }
];

/* ── 저장소 어댑터 ─────────────────────────────────────────────
 * Supabase/Firebase 로 바꿀 때 이 객체 안의 함수 몸통만 교체하면 된다.
 */
(function () {
  var KEYS = {
    userStories: "lv.userStories",
    voteDelta:   "lv.voteDelta",
    myVotes:     "lv.myVotes",
    daily:       "lv.daily"
  };

  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 저장 불가 환경 */ }
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // 시드 사연 + 증분(voteDelta) 합성. 사용자 사연은 votes 를 직접 저장.
  function allStories() {
    var delta = load(KEYS.voteDelta, {});
    var seeds = LV.seedStories.map(function (s) {
      var c = clone(s), d = delta[s.id];
      if (d) {
        Object.keys(d.main || {}).forEach(function (k) { c.votes[k] = (c.votes[k] || 0) + d.main[k]; });
        if (c.followUp) Object.keys(d.follow || {}).forEach(function (k) { c.followUp.votes[k] = (c.followUp.votes[k] || 0) + d.follow[k]; });
      }
      return c;
    });
    var users = load(KEYS.userStories, []).map(function (s) { var c = clone(s); c.isMine = true; return c; });
    return users.concat(seeds);
  }

  LV.repo = {
    KEYS: KEYS,

    listStories: function () {
      return Promise.resolve(allStories());
    },

    addStory: function (input) {
      var list = load(KEYS.userStories, []);
      var story = {
        id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        category: "새 사연",
        title: String(input.title).trim(),
        body: String(input.body).trim(),
        question: String(input.question).trim(),
        options: input.options.map(function (o, i) {
          return { key: i === 0 ? "a" : "b", label: String(o.label || o).trim(), traits: {} };
        }),
        votes: { a: 0, b: 0 },
        createdAt: new Date().toISOString()
      };
      list.unshift(story);
      save(KEYS.userStories, list);
      return Promise.resolve(clone(story));
    },

    castVote: function (storyId, kind, key) {
      var users = load(KEYS.userStories, []);
      var u = users.find(function (s) { return s.id === storyId; });
      if (u) {
        if (kind === "main") u.votes[key] = (u.votes[key] || 0) + 1;
        save(KEYS.userStories, users);
      } else {
        var delta = load(KEYS.voteDelta, {});
        var d = delta[storyId] || (delta[storyId] = { main: {}, follow: {} });
        var bucket = kind === "main" ? d.main : d.follow;
        bucket[key] = (bucket[key] || 0) + 1;
        save(KEYS.voteDelta, delta);
      }
      var mine = load(KEYS.myVotes, {});
      var rec = mine[storyId] || (mine[storyId] = {});
      rec[kind] = key;
      if (kind === "main") rec.at = new Date().toISOString();
      save(KEYS.myVotes, mine);
      var story = allStories().find(function (s) { return s.id === storyId; });
      return Promise.resolve(story);
    },

    getMyVotes: function () {
      return Promise.resolve(load(KEYS.myVotes, {}));
    },

    getDaily: function () {
      var d = load(KEYS.daily, null);
      if (!d || d.date !== today()) d = { date: today(), count: 0 };
      return Promise.resolve(d);
    },

    bumpDaily: function () {
      var d = load(KEYS.daily, null);
      if (!d || d.date !== today()) d = { date: today(), count: 0 };
      d.count += 1;
      save(KEYS.daily, d);
      return Promise.resolve(d);
    },

    // 오늘 하루 1회성 플래그 기록 (예: 성향 카드 노출 여부)
    markDaily: function (flag) {
      var d = load(KEYS.daily, null);
      if (!d || d.date !== today()) d = { date: today(), count: 0 };
      d[flag] = true;
      save(KEYS.daily, d);
      return Promise.resolve(d);
    }
  };
})();
