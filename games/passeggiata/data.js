/* Passeggiata — data.js
   게임 데이터 정의(아이템·이웃·품종·스토리 조각·엔딩) + 조건 판정 + 저장소 어댑터(PG.repo).
   UI 코드 없음. */
(function () {
  'use strict';
  const PG = (window.PG = window.PG || {});

  PG.SLOTS = ['hat', 'coat', 'shirt', 'tie', 'pants', 'shoes', 'acc'];
  PG.ALL_SLOTS = PG.SLOTS.concat(['dog']);
  PG.REQUIRED_SLOTS = ['shirt', 'pants', 'shoes'];
  PG.SLOT_LABEL = { hat: '모자', coat: '코트', shirt: '셔츠', tie: '타이', pants: '바지', shoes: '구두', acc: '소품', dog: '강아지' };

  /* 아이템. pal = 스프라이트 레이어 색(sprites.js 의 의미 문자에 대응).
     weather = 날씨 적합 보너스, color = 색 태그(이웃 취향 판정). */
  PG.ITEMS = [
    { id: 'shirt_white', slot: 'shirt', name: '흰 셔츠', price: 0, style: 1, color: 'white', starter: true,
      pal: { T: '#e8e4d8', A: '#f7f4ec', a: '#c4beaf', C: '#ffffff' } },
    { id: 'pants_grey', slot: 'pants', name: '회색 바지', price: 0, style: 1, color: 'grey', starter: true,
      pal: { L: '#737882', l: '#555a63', B: '#2f2a26' } },
    { id: 'shoes_brown', slot: 'shoes', name: '갈색 구두', price: 0, style: 1, color: 'brown', starter: true,
      pal: { F: '#7a4a2a', f: '#55321c', q: '#241812' } },

    { id: 'hat_panama', slot: 'hat', name: '파나마 모자', price: 40, style: 2, color: 'cream', shape: 'panama',
      weather: { sunny: 2 }, desc: '볕 좋은 날의 정답.',
      pal: { h: '#eadfb8', H: '#cdbf92', b: '#2b211c' } },
    { id: 'hat_borsalino', slot: 'hat', name: '보르살리노', price: 90, style: 3, color: 'brown', shape: 'fedora',
      weather: { cloudy: 1 }, desc: '펠트의 품격. 엔조가 알아본다.',
      pal: { h: '#5e4838', H: '#46352a', b: '#1f1814' } },
    { id: 'coat_navy', slot: 'coat', name: '네이비 더블 코트', price: 120, style: 3, color: 'blue', shape: 'double', len: 7,
      weather: { rain: 1, cloudy: 1 }, desc: '단추 여섯 개. 흐린 날에 든든하다.',
      pal: { T: '#2f3d5c', A: '#3e4e74', a: '#222b42', P: '#4b5c86', o: '#d6b25a' } },
    { id: 'coat_trench', slot: 'coat', name: '베이지 트렌치', price: 100, style: 3, color: 'beige', shape: 'trench', len: 9,
      weather: { cloudy: 2, rain: 1 }, desc: '흐린 날의 클래식.',
      pal: { T: '#c6a97a', A: '#d5ba8d', a: '#a3875b', P: '#dcc59d', o: '#7d633f' } },
    { id: 'shirt_linen', slot: 'shirt', name: '리넨 셔츠 (파랑)', price: 45, style: 2, color: 'blue',
      weather: { sunny: 1 }, desc: '바람이 통하는 파란 셔츠.',
      pal: { T: '#7ea5c8', A: '#96b9d9', a: '#5d83a6', C: '#aecbe5' } },
    { id: 'tie_burgundy', slot: 'tie', name: '버건디 타이', price: 30, style: 2, color: 'red', shape: 'long',
      desc: '단정함의 마지막 한 줄.', pal: { D: '#7a2232', d: '#96364a' } },
    { id: 'tie_scarf', slot: 'tie', name: '실크 스카프', price: 55, style: 2, color: 'blue', shape: 'ascot',
      desc: '목에 두른 하늘색 실크.', pal: { D: '#5f8fc4', d: '#e8e4d8' } },
    { id: 'pants_chino', slot: 'pants', name: '화이트 치노', price: 50, style: 2, color: 'white',
      weather: { sunny: 1 }, desc: '여름 리비에라의 바지.',
      pal: { L: '#ece6d4', l: '#c8bfa9', B: '#6b4a2f' } },
    { id: 'shoes_loafer', slot: 'shoes', name: '태슬 로퍼', price: 70, style: 2, color: 'brown',
      desc: '발끝에서 흔들리는 술 장식.', pal: { F: '#5a2620', f: '#3d1915', q: '#1c120e' } },
    { id: 'acc_cane', slot: 'acc', name: '지팡이', price: 80, style: 3, color: 'brown', shape: 'cane',
      desc: '짚기보다 멋으로 든다.', pal: { w: '#4a3020', s: '#c9ccd1' } },
    { id: 'acc_umbrella', slot: 'acc', name: '장우산', price: 35, style: 1, color: 'green', shape: 'umbrella',
      weather: { rain: 3 }, desc: '비 오는 날엔 펼쳐 든다.', pal: { u: '#55653d', U: '#3f4c2c', w: '#6b4a2f' } },
    { id: 'dog_collar', slot: 'dog', name: '빨간 목줄', price: 20, style: 1, color: 'red', shape: 'collar',
      desc: '강아지용. 소피아가 좋아한다.', pal: { c: '#b23a2a', y: '#e0b23a' } },
    { id: 'dog_scarf', slot: 'dog', name: '강아지 스카프', price: 25, style: 1, color: 'yellow', shape: 'bandana',
      desc: '강아지용 노란 반다나.', pal: { c: '#e3b341', C: '#b8862a' } },
  ];

  PG.BREEDS = [
    { id: 'dachshund', name: '닥스훈트', defaultName: 'Bruno', desc: '긴 허리, 짧은 다리' },
    { id: 'collie', name: '보더콜리', defaultName: 'Lola', desc: '영리한 흑백' },
    { id: 'poodle', name: '푸들', defaultName: 'Pino', desc: '크림색 곱슬' },
  ];

  /* 이웃. likes.type: color(색 태그) | slot(슬롯 착용) | dog(강아지 아이템) */
  PG.NEIGHBORS = [
    { id: 'marta', name: '마르타', role: '꽃집', prop: 'stall', gesture: 'hat', likes: { type: 'color', value: 'blue' },
      hint: '오늘은 마르타가 꽃을 내놓을 것 같아요. 파란색을 좋아한대요.',
      favLines: ['어머, 오늘 파란색이 참 잘 어울리세요!', '그 파란색… 오늘 들어온 꽃이랑 똑같네요.'],
      lines: ['좋은 아침이에요, 시뇨레.', '오늘도 단정하시네요.'] },
    { id: 'enzo', name: '엔조', role: '카페 바리스타', prop: 'cafe', gesture: 'talk', likes: { type: 'slot', value: 'hat' },
      hint: '엔조의 카페가 일찍 문을 연대요. 모자 쓴 신사를 좋아한대요.',
      favLines: ['오늘 모자 멋지네요! 에스프레소 한 잔 하시죠.', '그 모자, 우리 아버지 생각나네요.'],
      lines: ['본조르노! 오늘은 모자를 안 쓰셨네요?', '좋은 아침입니다, 늘 드시던 걸로?'] },
    { id: 'sofia', name: '소피아', role: '동네 꼬마', prop: null, gesture: 'bow', likes: { type: 'dog' },
      hint: '소피아가 학교 가는 길에 지나간대요. {dog}가 멋을 내면 좋아할 거예요.',
      favLines: ['{dog}! 오늘 진짜 멋쟁이다!', '{dog} 목에 그거 뭐예요? 너무 귀여워요!'],
      lines: ['{dog} 안녕! 할아버지도 안녕하세요!', '{dog} 한 번만 쓰다듬어도 돼요?'] },
  ];

  PG.WEATHER = {
    sunny: { label: '맑음' },
    cloudy: { label: '흐림' },
    rain: { label: '비' },
  };

  /* 스토리 조각(일기 한 줄). source:'dog' 은 산책 중 강아지가 발견할 때만 해금. */
  PG.FRAGMENTS = [
    { id: 'f_tie', cond: { type: 'walks', min: 2 }, text: '그는 오늘도 넥타이를 두 번 고쳐 맸다. 거울 속 누군가에게 보여주듯.' },
    { id: 'f_marta1', cond: { type: 'aff', who: 'marta', min: 2 }, text: '마르타가 말했다. "예전엔 두 분이 같이 지나가셨죠."' },
    { id: 'f_enzo1', cond: { type: 'aff', who: 'enzo', min: 2 }, text: '엔조는 묻지 않고 에스프레소를 내린다. 설탕 둘, 잔은 언제나 두 개.' },
    { id: 'f_sofia1', cond: { type: 'aff', who: 'sofia', min: 2 }, text: '소피아가 강아지 이름을 세 번 불렀다. 강아지는 꼬리로 대답했다.' },
    { id: 'f_dog1', source: 'dog', cond: { type: 'dogFree', min: 2 }, text: '강아지의 발견: 수풀 아래 머리핀 하나. 그는 한참을 들여다봤다.' },
    { id: 'f_closet', cond: { type: 'walks', min: 4 }, text: '옷장 맨 안쪽, 그녀가 골라준 넥타이는 아직 꺼내지 않았다.' },
    { id: 'f_marta2', cond: { type: 'aff', who: 'marta', min: 3 }, text: '마르타의 가게 앞엔 언제나 파란 꽃 한 다발이 팔리지 않고 남아 있다.' },
    { id: 'f_dog2', source: 'dog', cond: { type: 'dogFree', min: 4 }, text: '강아지의 발견: 낡은 사진 한 장. 같은 벤치, 같은 모자, 그리고 웃고 있는 한 사람.' },
    { id: 'f_promise', cond: { type: 'walks', min: 6 }, text: '산책은 약속이었다. 매일 아침, 가장 멋진 모습으로.' },
    { id: 'f_alley1', cond: { type: 'route', route: 'alley', min: 2 }, text: '뒷골목 벽에 분필로 그린 하트가 빗물에도 지워지지 않았다.' },
    { id: 'f_alley_rain', cond: { type: 'alleyRain', min: 1 }, text: '비 오는 뒷골목, 처마 밑에 둘이 서 있던 자리. 그는 잠깐 멈췄다가 걸었다.' },
    { id: 'f_park1', cond: { type: 'route', route: 'park', min: 2 }, text: '공원 벤치의 동판에 새겨진 이름을 그는 읽지 않고도 안다.' },
  ];

  /* 해금 조각이 없는 날의 일상 문장 */
  PG.DAILY_LINES = [
    '오늘 아침 빵집 냄새가 골목 끝까지 따라왔다.',
    '분수대 물소리가 어제보다 조금 높았다.',
    '모퉁이 고양이가 오늘은 인사를 받아주었다.',
    '구두 끝이 반짝여서 기분이 좋았다.',
    '덧문을 여는 소리로 동네가 깨어났다.',
    '바람이 넥타이를 한 번 들어 올렸다 놓았다.',
    '강아지가 돌아오는 길에 하품을 했다.',
    '오늘의 산책도 무사히. 내일도 그럴 것이다.',
  ];

  /* 엔딩. 배열 순서 = 같은 날 여러 개가 충족될 때의 재생 우선순위. */
  PG.ENDINGS = [
    { id: 'clock', title: '동네의 시계', tone: '따뜻',
      hint: '이웃 세 사람과 모두 가까워지면…',
      cond: { type: 'all', of: [
        { type: 'aff', who: 'marta', min: 3 }, { type: 'aff', who: 'enzo', min: 3 }, { type: 'aff', who: 'sofia', min: 3 }] },
      lines: ['어느 아침, 골목이 유난히 조용했다.',
        '마르타도, 엔조도, 소피아도 길에 나와 있었다. 그를 기다리며.',
        '"당신이 지나가야 우리 하루가 시작돼요."',
        '그는 모자를 고쳐 쓰고, 오늘도 천천히 걸었다.'],
      card: '그의 산책은 동네의 시계였다.' },
    { id: 'blue', title: '파란 꽃', tone: '짠함, 그리고 따뜻',
      hint: '꽃집 마르타가 좋아하는 색을 입고 자주 인사하면…',
      cond: { type: 'all', of: [{ type: 'aff', who: 'marta', min: 4 }, { type: 'blueDays', min: 2 }] },
      lines: ['마르타가 파란 꽃다발을 내밀었다.',
        '"그분이 좋아하시던 색이죠?"',
        '그는 대답 대신 꽃을 오래 바라보았다. 아내가 고르던 색이었다.',
        '집에 돌아와 꽃병에 물을 갈았다. 둘이 쓰던 식탁 위에.'],
      card: '아내가 좋아하던 색은 아직 동네에 남아 있었다.' },
    { id: 'lead', title: '앞장서는 발', tone: '강아지',
      hint: '강아지가 가고 싶은 곳에 자주 보내주면…',
      cond: { type: 'dogFree', min: 6 },
      lines: ['그날, 강아지가 처음 보는 골목으로 줄을 당겼다.',
        '골목 끝엔 오래된 벤치가 하나 있었다.',
        '그는 모자를 벗고 앉았다. 강아지가 무릎에 턱을 올렸다.',
        '"오늘은 네가 산책시켜 줬구나."'],
      card: '가끔은 따라가는 산책도 좋다.' },
  ];

  /* 조건 판정 (state = 세이브 객체) */
  PG.evalCond = function evalCond(c, s) {
    switch (c.type) {
      case 'all': return c.of.every((x) => evalCond(x, s));
      case 'aff': return (s.affinity[c.who] || 0) >= c.min;
      case 'dogFree': return (s.dogFree || 0) >= c.min;
      case 'blueDays': return (s.blueGreetDays || 0) >= c.min;
      case 'walks': return (s.day - 1) >= c.min;
      case 'route': return ((s.routeCounts && s.routeCounts[c.route]) || 0) >= c.min;
      case 'alleyRain': return (s.alleyRain || 0) >= c.min;
      default: return false;
    }
  };

  PG.newSave = function (breed, name) {
    return {
      v: 2,
      dog: { breed: breed, name: name },
      day: 1,
      coins: 30,
      owned: PG.ITEMS.filter((i) => i.starter).map((i) => i.id),
      equipped: { shirt: 'shirt_white', pants: 'pants_grey', shoes: 'shoes_brown' },
      affinity: { marta: 0, enzo: 0, sofia: 0 },
      dogFree: 0,
      blueGreetDays: 0,
      unlockedFragments: [],
      endingsSeen: [],
      pendingEnding: null,
      lastWalk: null,
      dogMood: 60,
      routeCounts: { park: 0, cafe: 0, alley: 0 },
      alleyRain: 0,
      gestKnown: {},
    };
  };

  /* 예전 세이브(v1 등)에 빠진 필드를 기본값으로 채운다. null 이면 그대로 null. */
  PG.migrate = function (s) {
    if (!s || typeof s !== 'object') return s || null;
    const d = PG.newSave((s.dog && s.dog.breed) || 'dachshund', (s.dog && s.dog.name) || 'Bruno');
    Object.keys(d).forEach((k) => { if (s[k] === undefined) s[k] = d[k]; });
    s.affinity = Object.assign({}, d.affinity, s.affinity || {});
    s.routeCounts = Object.assign({}, d.routeCounts, s.routeCounts || {});
    if (typeof s.dogMood !== 'number' || isNaN(s.dogMood)) s.dogMood = 60;
    if (!s.gestKnown || typeof s.gestKnown !== 'object') s.gestKnown = {};
    ['owned', 'unlockedFragments', 'endingsSeen'].forEach((k) => { if (!Array.isArray(s[k])) s[k] = d[k].slice(); });
    if (!s.equipped || typeof s.equipped !== 'object') s.equipped = Object.assign({}, d.equipped);
    s.v = 2;
    return s;
  };

  /* 저장소 어댑터. 게임은 이 객체로만 저장에 접근한다.
     백엔드를 바꿀 땐 이 세 함수의 몸통만 교체(Promise 계약 유지). */
  const KEY = 'pg.save';
  PG.repo = {
    KEY: KEY,
    load: function () {
      return new Promise(function (res) {
        try { const s = localStorage.getItem(KEY); res(s ? JSON.parse(s) : null); } catch (e) { res(null); }
      });
    },
    save: function (state) {
      return new Promise(function (res) {
        try { localStorage.setItem(KEY, JSON.stringify(state)); res(true); } catch (e) { res(false); }
      });
    },
    reset: function () {
      return new Promise(function (res) {
        try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
        res(true);
      });
    },
  };
})();
