/* 오늘의 연애판결 — 앱 레이어 (상태·화면·인터랙션)
 * 데이터는 반드시 LV.repo 를 통해서만 읽고 쓴다.
 */
(function () {
  "use strict";
  var repo = LV.repo;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUR = RM ? 1 : 250;
  var AD_EVERY = 5;

  var TRAITS = {
    trust:        { name: "신뢰",   title: "신뢰를 가장 중요하게 보는 현실주의자", desc: "말보다 행동, 약속을 지키는지를 먼저 봐요." },
    patience:     { name: "인내",   title: "끝까지 기회를 주는 인내파",           desc: "한 번의 실수보다 관계 전체의 흐름을 봐요." },
    practical:    { name: "현실",   title: "조건과 현실을 먼저 보는 전략가",       desc: "감정보다 돈·시간·미래 계획을 따져봐요." },
    romantic:     { name: "낭만",   title: "마음이 먼저인 낭만주의자",            desc: "작은 표현과 서운함을 그냥 넘기지 않아요." },
    independence: { name: "독립",   title: "각자의 삶을 존중하는 독립파",          desc: "연인이어도 각자의 공간이 필요하다고 믿어요." },
    fairness:     { name: "공평",   title: "공평함에 민감한 심판관",              desc: "누가 더 손해 보는지 정확히 짚어내요." }
  };

  var S = {
    tab: "home", feedTab: "hot",
    stories: [], byId: {}, myVotes: {}, daily: { count: 0 },
    feed: [], idx: 0, animating: false
  };

  // ── utils ──────────────────────────────────────────────
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return Number(n).toLocaleString("ko-KR"); }
  function sum(v) { return Object.keys(v).reduce(function (a, k) { return a + v[k]; }, 0); }
  function majorityKey(v) { var best = null; Object.keys(v).forEach(function (k) { if (best === null || v[k] > v[best]) best = k; }); return best; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function labelOf(opts, key) { var o = opts.find(function (x) { return x.key === key; }); return o ? o.label : key; }
  function isToday(iso) { if (!iso) return false; var d = new Date(iso), n = new Date(); return d.toDateString() === n.toDateString(); }
  function rankPct(n) { return { 5: 18, 10: 9, 15: 4, 20: 2 }[n] || 1; }

  var toastTimer;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2000);
  }

  // ── data load ──────────────────────────────────────────
  function refresh() {
    return Promise.all([repo.listStories(), repo.getMyVotes(), repo.getDaily()]).then(function (r) {
      S.stories = r[0]; S.myVotes = r[1]; S.daily = r[2];
      S.byId = {}; S.stories.forEach(function (s) { S.byId[s.id] = s; });
    });
  }

  function buildFeed() {
    var list = S.stories.slice();
    if (S.feedTab === "hot") list.sort(function (a, b) { return sum(b.votes) - sum(a.votes); });
    else if (S.feedTab === "new") list.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    else list = shuffle(list);
    var feed = [];
    list.forEach(function (s, i) {
      feed.push({ type: "story", id: s.id });
      if ((i + 1) % AD_EVERY === 0 && i < list.length - 1) feed.push({ type: "ad" });
    });
    feed.push({ type: "end" });
    S.feed = feed; S.idx = 0;
  }

  // ── header bits ────────────────────────────────────────
  function renderDaily() {
    var n = S.daily.count || 0;
    $("#daily").innerHTML = n ? "오늘 <b>" + n + "개</b> 판결함" : "오늘 첫 판결을 해보세요";
  }
  function renderFeedTabs() {
    Array.prototype.forEach.call($("#feedTabs").children, function (b) { b.setAttribute("aria-selected", b.dataset.feed === S.feedTab); });
  }

  // ── card rendering ─────────────────────────────────────
  function cardFor(item) {
    if (item.type === "ad") {
      return el('<article class="card ad"><span class="ad-tag">AD</span>' +
        '<button class="icon-btn ad-x" data-act="next" aria-label="광고 닫기"><svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<div class="ad-txt">광고 영역</div><div class="ad-sub">위로 넘기면 다음 사연</div>' +
        '<button class="pill ghost" data-act="next" style="margin-top:14px">다음</button></article>');
    }
    if (item.type === "end") {
      return el('<article class="card end"><h2>오늘 사연을 다 봤어요</h2><p>새 사연은 곧 올라와요.</p>' +
        '<button class="pill" data-act="restart">처음부터 다시</button></article>');
    }
    var s = S.byId[item.id];
    var c = el('<article class="card" data-id="' + s.id + '">' +
      '<div class="card-top"><span class="chip' + (s.isMine ? " mine" : "") + '">' + esc(s.isMine ? "내 사연" : s.category) + '</span></div>' +
      '<h2 class="title">' + esc(s.title) + '</h2>' +
      '<p class="body">' + esc(s.body) + '</p>' +
      '<div class="grow"></div>' +
      '<p class="q">' + esc(s.question) + '</p>' +
      '<div class="actions"></div>' +
      '</article>');
    var mv = S.myVotes[s.id];
    if (mv && mv.main) showMainResult(c, s, false);
    else {
      $(".actions", c).innerHTML = s.options.map(function (o, i) {
        return '<button class="vbtn' + (i === 0 ? " primary" : "") + '" data-vote="' + o.key + '">' + esc(o.label) + '</button>';
      }).join("");
    }
    return c;
  }

  function resultRows(opts, votes, mineKey) {
    var total = sum(votes) || 1, maj = majorityKey(votes);
    return opts.map(function (o) {
      var p = (votes[o.key] || 0) / total;
      return '<div class="row' + (o.key === mineKey ? " mine" : "") + '">' +
        '<div class="fill" data-p="' + p + '"></div>' +
        '<span class="lbl">' + esc(o.label) + (o.key === maj && sum(votes) > 0 ? '<span class="badge">다수</span>' : "") + '</span>' +
        '<span class="pct" data-p="' + Math.round(p * 100) + '">0%</span></div>';
    }).join("");
  }

  function animateBars(root, animate) {
    var fills = root.querySelectorAll(".fill"), pcts = root.querySelectorAll(".pct");
    var go = function () { fills.forEach(function (f) { f.style.transform = "scaleX(" + f.dataset.p + ")"; }); };
    if (!animate || RM) {
      fills.forEach(function (f) { f.style.transition = "none"; }); go();
      pcts.forEach(function (p) { p.textContent = p.dataset.p + "%"; });
      return;
    }
    requestAnimationFrame(function () { requestAnimationFrame(go); });
    var t0 = performance.now(), D = 420;
    (function tick(t) {
      var k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      pcts.forEach(function (p) { p.textContent = Math.round(p.dataset.p * e) + "%"; });
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function showMainResult(card, s, animate) {
    var mine = S.myVotes[s.id].main, maj = majorityKey(s.votes);
    var hasFollow = !!s.followUp;
    var box = $(".actions", card);
    card.classList.add("voted");
    box.className = "actions res" + (hasFollow ? " compact" : "") + (animate ? " fade" : "");
    box.innerHTML = '<div class="res-meta"><span><b>' + fmt(sum(s.votes)) + '명</b> 참여</span></div>' +
      resultRows(s.options, s.votes, mine) +
      (mine !== maj ? '<p class="minor">소수 의견이에요</p>' : "");
    animateBars(box, animate);
    if (hasFollow) {
      if (animate) setTimeout(function () { showFollow(card, s, true); }, RM ? 0 : 480);
      else showFollow(card, s, false);
    }
  }

  function showFollow(card, s, animate) {
    if (!card.isConnected && animate) return;
    var mv = S.myVotes[s.id] || {};
    var f = s.followUp;
    var wrap = $(".follow", card) || card.appendChild(el('<div class="follow"></div>'));
    card.classList.add("followed");
    if (animate) wrap.classList.add("slidein");
    if (mv.follow) {
      wrap.innerHTML = '<p class="q">' + esc(f.question) + '<small>' + fmt(sum(f.votes)) + '명 참여</small></p>' +
        '<div class="res compact">' + resultRows(f.options, f.votes, mv.follow) + '</div>';
      animateBars(wrap, animate);
    } else {
      wrap.innerHTML = '<p class="q">' + esc(f.question) + '</p><div class="fgrid">' +
        f.options.map(function (o) { return '<button class="vbtn" data-follow="' + o.key + '">' + esc(o.label) + '</button>'; }).join("") + '</div>';
    }
  }

  // ── voting ─────────────────────────────────────────────
  function vote(card, btn, key) {
    var id = card.dataset.id;
    if (!id || (S.myVotes[id] && S.myVotes[id].main)) return;
    btn.classList.add("pressed");
    card.querySelectorAll("[data-vote]").forEach(function (b) { b.disabled = true; });
    card.classList.remove("pulse"); void card.offsetWidth; card.classList.add("pulse");
    if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
    Promise.all([repo.castVote(id, "main", key), repo.bumpDaily()]).then(function (r) {
      S.byId[id] = r[0]; S.daily = r[1];
      return repo.getMyVotes();
    }).then(function (mv) {
      S.myVotes = mv;
      renderDaily();
      setTimeout(function () { showMainResult(card, S.byId[id], true); }, RM ? 0 : 320);
      afterVoteRewards();
    });
  }

  function voteFollow(card, btn, key) {
    var id = card.dataset.id, mv = S.myVotes[id];
    if (!mv || mv.follow) return;
    btn.classList.add("pressed");
    card.querySelectorAll("[data-follow]").forEach(function (b) { b.disabled = true; });
    if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
    repo.castVote(id, "follow", key).then(function (s) {
      S.byId[id] = s; return repo.getMyVotes();
    }).then(function (m) {
      S.myVotes = m;
      setTimeout(function () {
        var w = $(".follow", card); if (w) w.classList.remove("slidein");
        showFollow(card, S.byId[id], true);
      }, RM ? 0 : 200);
    });
  }

  function afterVoteRewards() {
    var n = S.daily.count;
    if (n > 0 && n % 5 === 0) setTimeout(function () { toast("당신은 오늘 상위 " + rankPct(n) + "%의 참견러입니다"); }, 700);
    if (n >= 10 && !S.daily.persona) {
      repo.markDaily("persona").then(function (d) { S.daily = d; });
      setTimeout(function () { showPersona(true); }, 1500);
    }
  }

  // ── persona ────────────────────────────────────────────
  function traitScores(todayOnly) {
    var sc = {}; Object.keys(TRAITS).forEach(function (k) { sc[k] = 0; });
    Object.keys(S.myVotes).forEach(function (id) {
      var v = S.myVotes[id], s = S.byId[id];
      if (!s || !v.main || (todayOnly && !isToday(v.at))) return;
      var o = s.options.find(function (x) { return x.key === v.main; });
      if (o && o.traits) Object.keys(o.traits).forEach(function (k) { if (k in sc) sc[k] += o.traits[k]; });
    });
    return sc;
  }
  function showPersona(todayOnly) {
    var sc = traitScores(todayOnly), keys = Object.keys(sc).sort(function (a, b) { return sc[b] - sc[a]; });
    var top = keys[0], max = sc[top] || 0;
    var html;
    if (!max) {
      html = '<div class="mcard"><div class="k">연애 성향</div><h2>아직 알 수 없어요</h2><p>사연 몇 개만 더 판결해 보세요.</p><button class="pill" data-act="close">닫기</button></div>';
    } else {
      var t = TRAITS[top];
      html = '<div class="mcard"><div class="k">' + (todayOnly ? "오늘의 연애 성향" : "나의 연애 성향") + '</div>' +
        '<h2>' + t.title + '</h2><p>' + t.desc + '</p><div class="bars">' +
        keys.slice(0, 3).map(function (k) { return '<div><span>' + TRAITS[k].name + '</span><i style="--p:' + (sc[k] / max).toFixed(2) + '"></i></div>'; }).join("") +
        '</div><button class="pill" data-act="close">닫기</button></div>';
    }
    closeSheet();
    var m = $("#modal"); m.innerHTML = html; m.classList.add("show"); openScrim();
  }
  function closeModal() { $("#modal").classList.remove("show"); closeScrim(); }

  // ── profile sheet ──────────────────────────────────────
  function stats() {
    var ids = Object.keys(S.myVotes).filter(function (id) { return S.myVotes[id].main && S.byId[id]; });
    var match = ids.filter(function (id) { return S.myVotes[id].main === majorityKey(S.byId[id].votes); }).length;
    return { total: ids.length, match: match, rate: ids.length ? Math.round(match / ids.length * 100) : 0, ids: ids };
  }
  function openSheet() {
    var st = stats();
    var sh = $("#sheet");
    sh.innerHTML = '<div class="grab"></div><h2>내 판결 현황</h2><div class="summary">' +
      '<div class="stat"><b>' + (S.daily.count || 0) + '</b><span>오늘 판결</span></div>' +
      '<div class="stat"><b>' + st.total + '</b><span>누적 판결</span></div>' +
      '<div class="stat"><b>' + (st.total ? st.rate + "%" : "-") + '</b><span>다수 일치율</span></div></div>' +
      '<button class="pill' + (st.total ? "" : " ghost") + '" data-act="persona" style="width:100%">' + (st.total ? "내 연애 성향 보기" : "판결을 하면 성향이 나와요") + '</button>';
    sh.style.display = "block"; openScrim();
    requestAnimationFrame(function () { requestAnimationFrame(function () { sh.classList.add("show"); }); });
  }
  function closeSheet() {
    var sh = $("#sheet"); if (!sh.classList.contains("show")) return;
    sh.classList.remove("show"); closeScrim();
    setTimeout(function () { if (!sh.classList.contains("show")) sh.style.display = "none"; }, 260);
  }
  function openScrim() { var s = $("#scrim"); s.style.display = "block"; requestAnimationFrame(function () { s.classList.add("show"); }); }
  function closeScrim() {
    if ($("#modal").classList.contains("show") || $("#sheet").classList.contains("show")) return;
    var s = $("#scrim"); s.classList.remove("show");
    setTimeout(function () { if (!s.classList.contains("show")) s.style.display = "none"; }, 220);
  }

  // ── feed navigation ────────────────────────────────────
  function mountCurrent() {
    var st = $("#stage"); st.innerHTML = "";
    st.appendChild(cardFor(S.feed[S.idx]));
  }
  function goNext(fromY) {
    if (S.animating) return;
    if (S.idx >= S.feed.length - 1) { springBack(); return; }
    S.animating = true;
    var st = $("#stage"), cur = st.lastElementChild;
    S.idx++;
    var nx = cardFor(S.feed[S.idx]);
    nx.style.transform = "translateY(100%)";
    st.appendChild(nx);
    var h = st.clientHeight;
    void nx.offsetWidth;
    var tr = "transform " + DUR + "ms cubic-bezier(.2,.8,.2,1), opacity " + DUR + "ms";
    cur.style.transition = tr; nx.style.transition = tr;
    cur.style.transform = "translateY(" + (-h * 0.6) + "px) scale(.94)"; cur.style.opacity = "0";
    nx.style.transform = "translateY(0)";
    setTimeout(function () {
      if (cur.parentNode) cur.parentNode.removeChild(cur);
      nx.style.transition = ""; nx.style.transform = "";
      S.animating = false;
    }, DUR + 20);
  }
  function springBack() {
    var cur = $("#stage").lastElementChild; if (!cur) return;
    cur.style.transition = "transform " + (RM ? 1 : 300) + "ms cubic-bezier(.34,1.56,.64,1)";
    cur.style.transform = "translateY(0)";
    setTimeout(function () { cur.style.transition = ""; cur.style.transform = ""; }, RM ? 10 : 320);
  }
  function restartFeed() { buildFeed(); mountCurrent(); }

  function showStoryNow(id) {
    // 내 기록에서 탭한 사연을 현재 위치에 끼워 보여준다
    S.feed.splice(S.idx, 0, { type: "story", id: id });
    setTab("home");
    mountCurrent();
  }

  // ── swipe (pointer events) ─────────────────────────────
  function bindSwipe() {
    var st = $("#stage"), y0 = 0, dy = 0, pid = null, dragging = false, suppress = false, card = null;
    st.addEventListener("pointerdown", function (e) {
      if (S.animating || pid !== null) return;
      pid = e.pointerId; y0 = e.clientY; dy = 0; dragging = false; card = st.lastElementChild;
    });
    st.addEventListener("pointermove", function (e) {
      if (e.pointerId !== pid || !card) return;
      var d = e.clientY - y0;
      if (!dragging) {
        if (Math.abs(d) < 8) return;
        dragging = true; try { st.setPointerCapture(pid); } catch (x) {}
        card.style.transition = "none";
      }
      dy = d < 0 ? d : d * 0.25;
      card.style.transform = "translateY(" + dy + "px)";
    });
    function end(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      if (!dragging) return;
      dragging = false; suppress = true; setTimeout(function () { suppress = false; }, 50);
      if (dy < -80 && S.idx < S.feed.length - 1) goNext(dy);
      else springBack();
    }
    st.addEventListener("pointerup", end);
    st.addEventListener("pointercancel", end);
    st.addEventListener("click", function (e) { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  // ── tabs & routing ─────────────────────────────────────
  function setTab(t, noHash) {
    S.tab = t;
    ["home", "write", "history"].forEach(function (k) { $("#view-" + k).classList.toggle("on", k === t); });
    Array.prototype.forEach.call($("#tabbar").children, function (b) { b.setAttribute("aria-selected", b.dataset.tab === t); });
    $("#homeSub").style.display = t === "home" ? "" : "none";
    $("#daily").style.display = t === "home" ? "" : "none";
    if (t === "history") renderHistory();
    if (t === "write") updateForm();
    if (!noHash) { try { history.replaceState(null, "", t === "home" ? location.pathname + location.search : "#" + t); } catch (e) {} }
  }

  // ── history ────────────────────────────────────────────
  function renderHistory() {
    var st = stats(), box = $("#historyBox");
    var head = '<h2 class="sec-h">내 기록</h2>';
    if (!st.total) {
      box.innerHTML = head + '<div class="empty">아직 판결한 사연이 없어요.<br>판결 탭에서 첫 판결을 해보세요.</div>';
      return;
    }
    var ids = st.ids.sort(function (a, b) { return new Date(S.myVotes[b].at || 0) - new Date(S.myVotes[a].at || 0); });
    box.innerHTML = head + '<p class="sec-p">' + st.total + '개 판결 · 다수 일치 ' + st.rate + '%</p>' +
      '<ul class="hlist">' + ids.map(function (id) {
        var s = S.byId[id], v = S.myVotes[id], maj = majorityKey(s.votes), total = sum(s.votes) || 1;
        var ok = v.main === maj;
        return '<li><button class="hitem" data-open="' + id + '"><h3>' + esc(s.title) + '</h3>' +
          '<div class="hline"><span>내 선택 <b>' + esc(labelOf(s.options, v.main)) + '</b></span>' +
          '<span>다수 <b>' + esc(labelOf(s.options, maj)) + '</b> ' + Math.round(s.votes[maj] / total * 100) + '%</span></div>' +
          '<span class="tag ' + (ok ? "ok" : "no") + '">' + (ok ? "다수와 일치" : "소수 의견") + '</span></button></li>';
      }).join("") + '</ul>';
  }

  // ── write ──────────────────────────────────────────────
  var F = ["fTitle", "fBody", "fQ", "fA", "fB"];
  function updateForm() {
    var ok = F.every(function (id) { return $("#" + id).value.trim().length > 0; });
    $("#submitBtn").disabled = !ok;
    document.querySelectorAll("[data-for]").forEach(function (sp) {
      var i = $("#" + sp.dataset.for); sp.textContent = i.value.length + "/" + i.maxLength;
    });
  }
  function bindWrite() {
    var form = $("#writeForm");
    form.addEventListener("input", updateForm);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if ($("#submitBtn").disabled) return;
      var v = function (id) { return $("#" + id).value.trim(); };
      $("#submitBtn").disabled = true;
      repo.addStory({ title: v("fTitle"), body: v("fBody"), question: v("fQ"), options: [{ label: v("fA") }, { label: v("fB") }] })
        .then(refresh).then(function () {
          form.reset(); updateForm();
          toast("올라갔어요");
          S.feedTab = "new"; renderFeedTabs(); buildFeed();
          setTab("home"); mountCurrent();
        });
    });
  }

  // ── global events ──────────────────────────────────────
  function bindUI() {
    $("#tabbar").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) setTab(b.dataset.tab); });
    $("#feedTabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-feed]"); if (!b || S.animating) return;
      S.feedTab = b.dataset.feed; renderFeedTabs(); restartFeed();
    });
    $("#nextBtn").addEventListener("click", function () { goNext(0); });
    $("#profileBtn").addEventListener("click", openSheet);
    $("#scrim").addEventListener("click", function () { $("#modal").classList.remove("show"); closeSheet(); closeScrim(); });
    $("#modal").addEventListener("click", function (e) {
      if (e.target.closest("[data-act=close]") || e.target === e.currentTarget) closeModal();
    });
    $("#sheet").addEventListener("click", function (e) {
      if (e.target.closest("[data-act=persona]") && stats().total) showPersona(false);
    });
    $("#stage").addEventListener("click", function (e) {
      var card = e.target.closest(".card"); if (!card) return;
      var b;
      if ((b = e.target.closest("[data-vote]"))) vote(card, b, b.dataset.vote);
      else if ((b = e.target.closest("[data-follow]"))) voteFollow(card, b, b.dataset.follow);
      else if (e.target.closest("[data-act=next]")) goNext(0);
      else if (e.target.closest("[data-act=restart]")) restartFeed();
    });
    $("#historyBox").addEventListener("click", function (e) {
      var b = e.target.closest("[data-open]"); if (b) showStoryNow(b.dataset.open);
    });
    window.addEventListener("hashchange", routeFromHash);
  }
  function routeFromHash() {
    var h = location.hash.replace("#", "");
    setTab(h === "write" || h === "history" ? h : "home", true);
  }

  // ── boot ───────────────────────────────────────────────
  refresh().then(function () {
    buildFeed(); renderFeedTabs(); renderDaily();
    bindUI(); bindSwipe(); bindWrite();
    mountCurrent(); routeFromHash();
  });
})();
