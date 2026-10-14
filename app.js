/* ================= 状态 ================= */
var state = {page:'page-home', appId:null, brandId:null, tutId:null, step:0, checkMode:'fraud',
             favs:[], font:'medium', autoTts:true};
var hist = [];
var TUT_INDEX = {};

/* ================= 初始化 ================= */
(function init(){
  // 建教程索引：id → {tut, appName, appEmoji}
  Object.keys(TUTORIALS).forEach(function(appId){
    var app = TUTORIALS[appId];
    app.tuts.forEach(function(t){ TUT_INDEX[t.id] = {tut:t, appName:app.name, appEmoji:app.emoji, kind:'app', group:appId}; });
  });
  Object.keys(BRAND_TUTS).forEach(function(bid){
    var brand = findObj(BRANDS,'id',bid);
    BRAND_TUTS[bid].forEach(function(t){ TUT_INDEX[t.id] = {tut:t, appName:brand.name+'·'+t.name, appEmoji:brand.emoji, kind:'brand', group:bid}; });
  });
  // 本地偏好
  state.font = lsGet('ylz_font') || 'medium';
  applyFont(state.font);
  state.autoTts = lsGet('ylz_autotts') !== '0';
  document.getElementById('autoTts').checked = state.autoTts;
  try{ state.favs = JSON.parse(lsGet('ylz_favs') || '[]'); }catch(e){ state.favs = []; }
  renderHome();
  renderFraudDefault();
  renderChips();
  renderRumorDefault();
  renderRumorChips();
  // 首次进入显示封面
  if(lsGet('ylz_seen')){
    var sp = document.getElementById('splash');
    sp.style.display = 'none';
  }
  document.getElementById('splash').addEventListener('click', function(){
    lsSet('ylz_seen','1');
    var sp = this;
    sp.classList.add('fade');
    setTimeout(function(){ sp.style.display = 'none'; }, 800);
  });
})();

/* ================= 本地存储安全封装（部分浏览器隐私模式下 setItem 会抛错） ================= */
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

/* 用户输入进 HTML 前转义 */
function esc(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function findObj(arr, key, val){
  for(var i=0;i<arr.length;i++){ if(arr[i][key]===val) return arr[i]; }
  return null;
}

/* ================= 页面切换 ================= */
function show(id){
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  document.getElementById('tabbar').style.display = (id==='page-tut') ? 'none' : 'flex';
  state.page = id;
  stopSpeak();
  window.scrollTo(0,0);
}
function push(id){ hist.push(state.page); show(id); }
function goBack(){
  var prev = hist.pop() || 'page-home';
  show(prev);
}
function switchTab(name){
  var map = {home:'page-home', fraud:'page-fraud', favs:'page-favs', settings:'page-settings'};
  ['home','fraud','favs','settings'].forEach(function(n){
    document.getElementById('tab-'+n).classList.toggle('on', n===name);
  });
  hist = [];
  if(name==='favs') renderFavs();
  show(map[name]);
}

/* ================= 首页 ================= */
/* 官方图标渲染（加载失败自动退回 emoji，保证永不空图） */
function appIconHtml(a){
  if(!a.icon) return '<span class="em">'+a.emoji+'</span>';
  return '<img src="'+a.icon+'" alt="'+a.name+'" style="width:64px;height:64px;border-radius:14px;object-fit:cover" '
       + 'onerror="this.outerHTML=\'<span class=&quot;em&quot;>'+a.emoji+'</span>\'">';
}
function renderHome(){
  var g = document.getElementById('appGrid');
  g.innerHTML = '';
  APPS.forEach(function(a){
    var c = document.createElement('div');
    c.className = 'app-card';
    c.onclick = function(){ openApp(a.id); };
    c.innerHTML = appIconHtml(a) + '<span class="nm">'+a.name+'</span><span class="dd">'+a.desc+'</span>';
    g.appendChild(c);
  });
}

/* 教程列表项构建（软件教程页与品牌教程页共用） */
function tutListHtml(tuts){
  return tuts.map(function(t, i){
    return '<div class="list-item" onclick="openTut(\''+t.id+'\')">'
      + '<div class="num">'+(i+1)+'</div>'
      + '<div class="info"><div class="nm">'+t.icon+' '+t.name+(t.ver?'<span class="ver">'+t.ver+'</span>':'')+'</div>'
      + '<div class="sub">'+t.sub+' · '+t.steps.length+' 步</div></div>'
      + '<span class="ar">›</span></div>';
  }).join('');
}

/* ================= 软件教程列表 ================= */
function openApp(appId){
  state.appId = appId;
  if(appId === 'phone'){
    push('page-brands');
    renderBrands();
    return;
  }
  var app = TUTORIALS[appId];
  document.getElementById('appTitle').textContent = app.emoji + ' ' + app.name;
  document.getElementById('appContent').innerHTML = shotsHtml(appId) + tutListHtml(app.tuts) + helpLinkHtml('apps', appId);
  push('page-app');
}
/* 官方手册入口：版权干净、权威，打不开也不影响教程使用 */
function helpLinkHtml(group, key){
  var h = (typeof HELP_LINKS !== 'undefined' && HELP_LINKS[group] && HELP_LINKS[group][key]) || null;
  if(!h) return '';
  return '<a class="help-link" href="'+h.url+'" target="_blank" rel="noopener">'
       + '📖 官方手册：'+h.name+'<span class="hx">›</span></a>';
}
/* 商店真机截图画廊：先看真实样子，再进图文教程 */
function shotsHtml(appId){
  var n = (typeof REAL_SHOTS !== 'undefined' && REAL_SHOTS[appId]) || 0;
  if(!n) return '';
  var imgs = '';
  for(var i=1;i<=n;i++){
    imgs += '<img src="assets/realshots/'+appId+'-'+i+'.png" alt="真实界面'+i+'" loading="lazy" '
         +  'onerror="this.style.display=\'none\'">';
  }
  return '<div class="shot-wrap"><div class="shot-title">📱 真实界面长这样（左右滑动看）</div>'
       + '<div class="shot-row">'+imgs+'</div>'
       + '<div class="shot-note">截图来自 App Store 商店页 · 版权归原厂所有 · 仅作学习参考</div></div>';
}

/* ================= 品牌 ================= */
function renderBrands(){
  var g = document.getElementById('brandGrid');
  g.innerHTML = '';
  BRANDS.forEach(function(b){
    var c = document.createElement('div');
    c.className = 'app-card';
    c.onclick = function(){ openBrand(b.id); };
    c.innerHTML = '<img src="'+b.icon+'" alt="'+b.name+'" style="width:56px;height:56px;border-radius:12px;object-fit:cover" '
                + 'onerror="this.outerHTML=\'<span class=&quot;em&quot;>'+b.emoji+'</span>\'">'
                + '<span class="nm">'+b.name+'</span>';
    g.appendChild(c);
  });
}
function openBrand(bid){
  state.brandId = bid;
  var brand = findObj(BRANDS,'id',bid);
  document.getElementById('brandTitle').textContent = brand.emoji + ' ' + brand.name + '手机';
  document.getElementById('brandTutsContent').innerHTML = tutListHtml(BRAND_TUTS[bid]) + helpLinkHtml('brands', bid);
  push('page-brandtuts');
}

/* ================= 教程步骤页 ================= */
function openTut(tid){
  var entry = TUT_INDEX[tid];
  if(!entry){ toast('抱歉，教程走丢了'); return; }
  state.tutId = tid;
  state.step = 0;
  updateFavBtn();
  document.getElementById('tutTitle').textContent = entry.tut.icon + ' ' + entry.tut.name;
  renderStep();
  push('page-tut');
}
function renderStep(){
  var entry = TUT_INDEX[state.tutId];
  if(!entry) return;
  var steps = entry.tut.steps;
  var s = steps[state.step];
  var total = steps.length;
  document.getElementById('stepIndicator').textContent = (state.step+1)+'/'+total;
  document.getElementById('prevBtn').disabled = (state.step===0);
  document.getElementById('nextBtn').disabled = (state.step===total-1);
  var h = '<div class="step-card">'
        + '<div class="step-top"><div class="step-num">'+(state.step+1)+'</div>'
        + '<div class="step-text">'+s.d+'</div></div>'
        + (s.hint ? '<div class="step-hint">💡 '+s.hint+'</div>' : '')
        + '<div class="step-img">'+(stepImgSrc(s) ? stepPhoto(stepImgSrc(s), s.d) : stepPlaceholder(s.d))+'</div>'
        + '<div class="tts-row"><button class="tts-btn" id="ttsBtn" onclick="toggleSpeakStep()">🔊 读给我听</button></div>'
        + '</div>';
  document.getElementById('stepContent').innerHTML = h;
  // 最后一步显示「学会了」
  document.getElementById('doneRow').innerHTML = (state.step===total-1)
    ? '<button class="big-btn" onclick="onDone()">✅ 学会了！</button>' : '';
  if(state.autoTts) speakStep();
}
function stepImgSrc(s){
  /* 步骤示意图来源：数据里显式 img 优先，否则按命名约定查注册表（tools/make-diagrams.js 生成） */
  if(s.img) return s.img;
  var n = (typeof STEP_IMGS !== 'undefined' && STEP_IMGS[state.tutId]) || 0;
  return state.step < n ? 'assets/steps/' + state.tutId + '-' + (state.step + 1) + '.svg' : null;
}
function stepPhoto(src, dText){
  /* 官方步骤示意图（assets/steps/）；加载失败退回占位图，离线也不空白 */
  return '<img class="step-photo" src="'+src+'" alt="步骤示意图" '
       + 'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'
       + '<div style="display:none">'+stepPlaceholder(dText)+'</div>';
}
function stepPlaceholder(text){
  var ch = text.replace(/[^A-Za-z0-9\u4e00-\u9fa5]/g,'').charAt(0) || '学';
  var colors = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#F7DC6F','#BB8FCE','#F8B500','#26C6DA','#EC7063','#58D68D'];
  var color = colors[Math.abs(ch.charCodeAt(0)) % colors.length];
  return '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="180" viewBox="0 0 240 180">'
    + '<rect width="240" height="180" fill="#F5EDE8"/>'
    + '<rect x="45" y="20" width="150" height="140" rx="14" fill="'+color+'" opacity="0.13"/>'
    + '<rect x="45" y="20" width="150" height="140" rx="14" fill="none" stroke="'+color+'" stroke-width="3" stroke-dasharray="8,5"/>'
    + '<text x="120" y="88" text-anchor="middle" fill="'+color+'" font-size="52" font-weight="bold" font-family="sans-serif">'+ch+'</text>'
    + '<text x="120" y="126" text-anchor="middle" fill="'+color+'" font-size="16" font-family="sans-serif">真机截图制作中</text>'
    + '</svg>';
}
function prevStep(){
  var entry = TUT_INDEX[state.tutId]; if(!entry) return;
  if(state.step > 0){ state.step--; renderStep(); }
}
function nextStep(){
  var entry = TUT_INDEX[state.tutId]; if(!entry) return;
  if(state.step < entry.tut.steps.length-1){ state.step++; renderStep(); }
}
function onDone(){
  toast('真棒！这个教程学会了 🎉');
  speak('真棒，教程学会了');
  setTimeout(function(){ goBack(); }, 900);
}

/* ================= 语音播报（TTS） ================= */
function ttsOK(){ return 'speechSynthesis' in window; }
function speak(text){
  if(!ttsOK() || !text) return;
  try{
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 1;
    speechSynthesis.speak(u);
  }catch(e){}
}
function stopSpeak(){ if(ttsOK()){ try{ speechSynthesis.cancel(); }catch(e){} } }
function speakStep(){
  var entry = TUT_INDEX[state.tutId]; if(!entry) return;
  var s = entry.tut.steps[state.step];
  speak('第 '+(state.step+1)+' 步。'+s.d+(s.hint?'。小提醒：'+s.hint:''));
}
function toggleSpeakStep(){
  var btn = document.getElementById('ttsBtn');
  if(btn.classList.contains('on')){ stopSpeak(); btn.classList.remove('on'); btn.textContent='🔊 读给我听'; }
  else{ speakStep(); btn.classList.add('on'); btn.textContent='⏹ 停止朗读'; }
}
function setAutoTts(v){
  state.autoTts = v;
  if(!v) stopSpeak();
  lsSet('ylz_autotts', v ? '1':'0');
  toast(v ? '已开启自动朗读' : '已关闭朗读');
}

/* ================= 收藏 ================= */
function isFav(tid){ return state.favs.indexOf(tid) >= 0; }
function updateFavBtn(){
  var btn = document.getElementById('favBtn');
  var fav = isFav(state.tutId);
  btn.textContent = fav ? '❤️' : '🤍';
}
function toggleFav(){
  if(!state.tutId) return;
  var i = state.favs.indexOf(state.tutId);
  if(i>=0){ state.favs.splice(i,1); toast('已取消收藏'); }
  else{ state.favs.push(state.tutId); toast('已收藏，在【收藏】里找'); }
  lsSet('ylz_favs', JSON.stringify(state.favs));
  updateFavBtn();
}
function renderFavs(){
  var el = document.getElementById('favList');
  if(state.favs.length===0){
    el.innerHTML = '<div class="empty"><div class="em">🤍</div>还没有收藏<br><span style="font-size:.8rem">打开教程，点右上角的小爱心</span></div>';
    return;
  }
  var h = '';
  state.favs.forEach(function(tid){
    var e = TUT_INDEX[tid];
    if(!e) return;
    h += '<div class="list-item" onclick="openTut(\''+tid+'\')">'
       + '<span class="em">'+e.appEmoji+'</span>'
       + '<div class="info"><div class="nm">'+e.tut.icon+' '+e.tut.name+'</div>'
       + '<div class="sub">'+e.appName+' · '+e.tut.steps.length+' 步</div></div>'
       + '<button class="del-btn" onclick="event.stopPropagation();delFav(\''+tid+'\')">✕</button></div>';
  });
  el.innerHTML = h;
}
function delFav(tid){
  var i = state.favs.indexOf(tid);
  if(i>=0) state.favs.splice(i,1);
  lsSet('ylz_favs', JSON.stringify(state.favs));
  renderFavs();
}

/* ================= 搜索（大小写不敏感：英文如 WiFi/wifi 应可互搜） ================= */
function onSearch(v){
  var el = document.getElementById('searchResults');
  v = (v||'').trim();
  if(!v){ el.innerHTML=''; return; }
  var k = v.toLowerCase();
  var hits = [];
  var tids = Object.keys(TUT_INDEX);
  for (var i = 0; i < tids.length && hits.length < 12; i++) {
    var e = TUT_INDEX[tids[i]];
    var inName = e.tut.name.toLowerCase().indexOf(k)>=0 || e.appName.toLowerCase().indexOf(k)>=0;
    var stepHit = null;
    e.tut.steps.forEach(function(s){ if(!stepHit && s.d.toLowerCase().indexOf(k)>=0) stepHit = s.d; });
    if(inName || stepHit) hits.push({e:e, why: stepHit && !inName ? stepHit : null});
  }
  if(hits.length===0){
    el.innerHTML = '<div class="empty" style="padding:24px">没找到「'+esc(v)+'」<br><span style="font-size:.8rem">换个词试试，如：视频、付款、WiFi</span></div>';
    return;
  }
  var h = '';
  hits.forEach(function(r){
    h += '<div class="sr-item" onclick="openTut(\''+r.e.tut.id+'\')">'
       + '<span class="em">'+r.e.appEmoji+'</span>'
       + '<div><div class="nm">'+r.e.tut.icon+' '+r.e.tut.name+'<span class="sub"> · '+r.e.appName+'</span></div>'
       + (r.why ? '<div class="sub">含：'+r.why+'</div>' : '<div class="sub">'+r.e.tut.sub+'</div>')
       + '</div></div>';
  });
  el.innerHTML = h;
}

/* ================= 查一查（防骗 + 辟谣 双模式共用引擎） ================= */

/* 通用规则匹配：输入与关键词做包含计分，按得分降序 */
function matchRules(rules, input){
  var hits = [];
  rules.forEach(function(r){
    var score = 0;
    r.k.forEach(function(kw){ if(input.indexOf(kw)>=0) score++; });
    if(score>0) hits.push({r:r, score:score});
  });
  hits.sort(function(a,b){ return b.score - a.score; });
  return hits;
}

/* 判断级 → 配色/图标（防骗与辟谣共用一张映射表） */
var VERDICT_STYLE = {
  '骗子':{cls:'v-red',    icon:'🚨'},
  '危险':{cls:'v-red',    icon:'🆘'},
  '警惕':{cls:'v-orange', icon:'⚠️'},
  '误导':{cls:'v-orange', icon:'⚠️'},
  '夸大':{cls:'v-orange', icon:'⚠️'},
  '官方':{cls:'v-green',  icon:'✅'},
  '假谣言':{cls:'v-red',  icon:'🚨'}
};

/* 「三个问题」卡片（两个模式共用渲染） */
function q3Html(title, list){
  var h = '<div class="tips-card"><div style="font-weight:bold;margin-bottom:6px">'+title+'</div>';
  list.forEach(function(q,i){ h += '<div class="q3-item"><div class="qn">'+(i+1)+'</div><div>'+q+'</div></div>'; });
  return h + '</div>';
}

/* 命中结果卡（q/v/m/a 四字段的结构两个模式一致） */
function verdictCard(top, qLabel){
  var st = VERDICT_STYLE[top.v] || {cls:'v-orange', icon:'⚠️'};
  return '<div class="verdict '+st.cls+'">'
       + '<div class="vt">'+st.icon+' 判断：'+top.v+'</div>'
       + '<div class="vq">'+qLabel+'：「'+top.q+'」</div>'
       + '<div class="vm">📢 '+top.m+'</div>'
       + '<div class="va">👉 '+top.a+'</div></div>';
}

/* 其余命中（第 2~4 名，点一下填回输入框） */
function moreHitsHtml(hits, mode){
  if(hits.length<=1) return '';
  var h = '<div class="tips-card">';
  hits.slice(1,4).forEach(function(x){
    h += '<div class="ti" style="cursor:pointer" onclick="chipUse(\''+mode+'\',\''+x.r.k[0]+'\')"><span class="em">▪</span><span>'+x.r.q+'<br><b>'+x.r.m+'</b></span></div>';
  });
  return h + '</div>';
}

/* ---- 模式切换 ---- */
function switchCheckMode(m){
  state.checkMode = m;
  document.getElementById('seg-fraud').classList.toggle('on', m==='fraud');
  document.getElementById('seg-rumor').classList.toggle('on', m==='rumor');
  document.getElementById('mode-fraud').style.display = (m==='fraud') ? '' : 'none';
  document.getElementById('mode-rumor').style.display = (m==='rumor') ? '' : 'none';
  stopSpeak();
}

/* 快捷词 chips（数据在 data/*.js，本函数只负责渲染） */
function renderChipList(elId, chips, mode){
  var h = '';
  chips.forEach(function(c){ h += '<button class="chip" onclick="chipUse(\''+mode+'\',\''+c+'\')">'+c+'</button>'; });
  document.getElementById(elId).innerHTML = h;
}
function renderChips(){ renderChipList('fraudChips', FRAUD_CHIPS, 'fraud'); }
function renderRumorChips(){ renderChipList('rumorChips', RUMOR_CHIPS, 'rumor'); }

/* 点快捷词/其余命中：填入输入框并查询（两个模式共用） */
function chipUse(mode, kw){
  document.getElementById(mode==='fraud' ? 'fraudInput' : 'rumorInput').value = kw;
  if(mode==='fraud') doFraud(); else doRumor();
}
function onFraudInput(v){ if(!v.trim()) renderFraudDefault(); }
function onRumorInput(v){ if(!v.trim()) renderRumorDefault(); }

/* 播报文案（按判断级映射，两个模式共用） */
var SPEAK_TEXT = {
  '骗子':   function(m){ return '注意，这是骗子。' + m; },
  '假谣言': function(m){ return '注意，这是假谣言。' + m; },
  '危险':   function(m){ return '危险说法。' + m + '，请先问医生'; }
};
function speakVerdict(v, m){
  var f = SPEAK_TEXT[v];
  speak(f ? f(m) : m);
}
function renderFraudDefault(){
  var h = '<div class="tips-card">';
  FRAUD_TOP_TIPS.forEach(function(t){ h += '<div class="ti"><span class="em">'+t.icon+'</span><span>'+t.text+'</span></div>'; });
  h += '</div>' + q3Html('🤔 拿不准？先问自己三个问题', FRAUD_3QUESTIONS);
  document.getElementById('fraudResult').innerHTML = h;
}
function doFraud(){
  var v = (document.getElementById('fraudInput').value||'').trim();
  if(!v){ renderFraudDefault(); return; }
  var hits = matchRules(FRAUD_RULES, v);
  var h = '';
  if(hits.length===0){
    h += '<div class="verdict v-orange"><div class="vt">🤔 话术库里没有这条</div>'
       + '<div class="vm">拿不准 = 先停下来</div>'
       + '<div class="va">「没查到」不代表没问题。看看下面三个问题，再决定怎么做。</div>'
       + '<div class="va" style="margin-top:8px"><button class="chip" onclick="switchCheckMode(\'rumor\')">像是养生说法？去辟谣查一查 →</button></div></div>';
  }else{
    var top = hits[0].r;
    h += verdictCard(top, '常见话术');
    speakVerdict(top.v, top.m);
    h += moreHitsHtml(hits, 'fraud');
  }
  h += q3Html('🤔 三个问题再确认一遍', FRAUD_3QUESTIONS);
  document.getElementById('fraudResult').innerHTML = h;
}

/* ---- 辟谣模式（谣言查一查，M-10） ---- */
function renderRumorDefault(){
  var h = '<div class="tips-card">';
  RUMOR_TOP_TIPS.forEach(function(t){ h += '<div class="ti"><span class="em">'+t.icon+'</span><span>'+t.text+'</span></div>'; });
  h += '</div>' + q3Html('🤔 辟谣三问', RUMOR_3QUESTIONS);
  document.getElementById('rumorResult').innerHTML = h;
}
function doRumor(){
  var v = (document.getElementById('rumorInput').value||'').trim();
  if(!v){ renderRumorDefault(); return; }
  var hits = matchRules(RUMOR_RULES, v);
  var h = '';
  if(hits.length===0){
    h += '<div class="verdict v-orange"><div class="vt">🤔 核查库里没有这条说法</div>'
       + '<div class="vm">没查到 ≠ 是真的，先别信也别转发</div>'
       + '<div class="va">拿不准就问子女、问医生，或点下方官方平台搜一搜。</div>'
       + '<div class="va" style="margin-top:8px"><button class="chip" onclick="switchCheckMode(\'fraud\')">像是有人骗钱？去防骗查一查 →</button></div></div>';
  }else{
    var top = hits[0].r;
    h += verdictCard(top, '常见说法');
    speakVerdict(top.v, top.m);
    h += moreHitsHtml(hits, 'rumor');
  }
  h += q3Html('🤔 辟谣三问，再过一遍', RUMOR_3QUESTIONS);
  document.getElementById('rumorResult').innerHTML = h;
}

/* ================= 设置 ================= */
function setFont(s){
  applyFont(s);
  lsSet('ylz_font', s);
}
function applyFont(s){
  document.documentElement.className = 'font-'+s;
  state.font = s;
  document.querySelectorAll('.size-btn').forEach(function(b){ b.classList.remove('on'); });
  document.querySelectorAll('.size-btn').forEach(function(b){
    var label = b.textContent;
    if((s==='small'&&label==='小')||(s==='medium'&&label==='中')||(s==='large'&&label==='大')) b.classList.add('on');
  });
}

/* ================= 提示 ================= */
function toast(msg){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 1800);
}
