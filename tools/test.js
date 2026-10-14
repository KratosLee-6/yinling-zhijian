#!/usr/bin/env node
/* ============================================================
 * 银龄指尖 · 自动化测试套件（jsdom，无真实浏览器依赖）
 * 覆盖：页面初始化 / 导航栈 / 教程翻页 / 查一查双模式 /
 *       搜索（大小写不敏感）/ 收藏持久化 / 字号 / 单元函数
 * 用法：node tools/test.js   （退出码 0=全部通过）
 * ============================================================ */
const { JSDOM } = require('jsdom');
const path = require('path');
const root = path.join(__dirname, '..');

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  \u2713 ' + msg); }
  else { fail++; console.log('  \u2717 ' + msg); }
}
function section(name) { console.log('\n[' + name + ']'); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  /* jsdom 对 file:// 源不提供 localStorage（opaque origin 抛 SecurityError），
   * 故读取 index.html 后把三个脚本内联，以 http://localhost 源构造 DOM（同步、确定性加载）。 */
  const fs = require('fs');
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  ['data/tutorials.js', 'data/rumors.js', 'data/step-imgs.js', 'data/realshots.js', 'data/help-links.js', 'app.js'].forEach(f => {
    const code = fs.readFileSync(path.join(root, f), 'utf8');
    html = html.replace('<script src="' + f + '"></script>', '<script>\n' + code + '\n</script>');
  });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    beforeParse(window) { window.scrollTo = () => {}; }
  });
  const w = dom.window, d = w.document;
  const $ = (sel) => d.querySelector(sel);
  const $$ = (sel) => d.querySelectorAll(sel);
  for (let i = 0; i < 50 && $$('#appGrid .app-card').length < 10; i++) await sleep(50);

  const active = () => d.querySelector('.page.active').id;

  /* ---------- 1. 初始化与首页 ---------- */
  section('初始化与首页');
  ok($$('#appGrid .app-card').length === 10, '首页渲染 10 个软件宫格');
  ok($$('#appGrid .app-card img').length === 10, '首页 10 宫格全部使用官方图标（非 emoji 常态）');
  ok(typeof w.TUTORIALS === 'object' && typeof w.RUMOR_RULES === 'object', '数据层脚本已加载');
  ok(typeof w.openTut === 'function' && typeof w.matchRules === 'function', '逻辑层脚本已加载');
  ok($$('#fraudChips .chip').length === 10 && $$('#rumorChips .chip').length === 10, '防骗/辟谣快捷词各 10 个');
  w.localStorage.setItem('ylz_seen', '1');
  w.document.getElementById('splash').style.display = 'none';

  /* ---------- 2. 教程导航与翻页 ---------- */
  section('教程导航与翻页');
  w.openApp('wechat');
  ok(active() === 'page-app' && $$('#appContent .list-item').length === 18, '微信教程列表 18 条');
  ok($$('#appContent .shot-row img').length === 6, '微信 APP 页顶部真机截图画廊 6 张');
  ok($('#appContent .shot-note', d).textContent.includes('版权归原厂'), '真机截图带版权来源标注');
  const hl = $('#appContent .help-link', d);
  ok(!!hl && hl.getAttribute('href') === 'https://kf.qq.com/' && hl.textContent.includes('官方手册'), '微信 APP 页带官方手册入口（腾讯客服）');
  w.openApp('phone');
  ok($$('#brandGrid .app-card').length === 6, '品牌选择页 6 个品牌');
  ok(!$('#page-brands .shot-row', d), '品牌页不渲染截图画廊');
  w.openBrand('huawei');
  ok(active() === 'page-brandtuts' && $$('#brandTutsContent .list-item').length === 4, '华为 4 条设置教程（M-03）');
  w.openTut('wx-video');
  ok(active() === 'page-tut' && $('#stepIndicator', d).textContent === '1/4', '打开教程显示 1/4');
  ok($('#prevBtn', d).disabled === true, '第 1 步「上一步」禁用');
  const ph1 = $('#stepContent .step-photo', d);
  ok(!!ph1 && ph1.getAttribute('src') === 'assets/steps/wx-video-1.svg', '第 1 步渲染示意图 wx-video-1');
  ok($('#stepContent .step-photo + div', d).style.display === 'none', '示意图自带占位回退（离线兜底）');
  w.nextStep(); w.nextStep(); w.nextStep();
  ok($('#stepIndicator', d).textContent === '4/4', '翻到第 4 步');
  ok($('#nextBtn', d).disabled === true, '末步「下一步」禁用');
  ok(!!$('#doneRow .big-btn', d), '末步出现「学会了」按钮');
  ok($('#stepContent .step-photo', d).getAttribute('src') === 'assets/steps/wx-video-4.svg', '第 4 步渲染示意图 wx-video-4');
  w.goBack();
  ok(active() === 'page-brandtuts', '返回回到品牌教程列表（历史栈）');
  w.switchTab('favs'); w.openTut('wx-msg');
  ok(active() === 'page-tut', '从收藏页可打开教程');
  ok($('#stepContent .step-photo', d).getAttribute('src') === 'assets/steps/wx-msg-1.svg', '注册表教程渲染示意图 wx-msg-1（命名约定）');
  delete w.STEP_IMGS['wx-msg']; w.renderStep();
  ok(!$('#stepContent .step-photo', d) && $('#stepContent .step-img svg', d), '注册表缺项时回退占位图');
  w.STEP_IMGS['wx-msg'] = 4; w.state.step = 0; w.renderStep();
  ok($('#stepContent .step-photo', d).getAttribute('src') === 'assets/steps/wx-msg-1.svg', '恢复注册表后示意图回到第 1 步');
  w.openTut('hw-wifi');
  ok($('#stepContent .step-photo', d).getAttribute('src') === 'assets/steps/hw-wifi-1.svg', '品牌教程也走注册表（hw-wifi-1）');
  w.goBack(); /* 对齐原用例的历史栈深度（多开了一层教程页） */
  w.goBack();
  ok(active() === 'page-favs', '返回回到收藏页（switchTab 后历史正确）');

  /* ---------- 3. 查一查：防骗模式 ---------- */
  section('查一查 · 防骗');
  w.switchTab('fraud');
  d.getElementById('fraudInput').value = '刚才电话说我中奖了，先交税';
  w.doFraud();
  ok($('#fraudResult .verdict', d).className.includes('v-red'), '中奖话术 → 骗子（红卡）');
  ok($('#fraudResult .verdict', d).textContent.includes('判断：骗子'), '判断文案正确');
  d.getElementById('fraudInput').value = '你好呀今天天气不错';
  w.doFraud();
  ok($('#fraudResult .verdict', d).textContent.includes('话术库里没有这条'), '未命中走兜底文案');
  ok(!!$('#fraudResult .verdict .chip', d), '未命中给「去辟谣」互导链接');

  /* ---------- 4. 查一查：辟谣模式 ---------- */
  section('查一查 · 辟谣');
  w.switchCheckMode('rumor');
  ok($('#seg-rumor', d).classList.contains('on') && $('#mode-rumor', d).style.display === '', '分段切换到辟谣');
  ok($('#seg-fraud', d).classList.contains('on') === false && $('#mode-fraud', d).style.display === 'none', '防骗面板隐藏');
  d.getElementById('rumorInput').value = '隔夜水放一天还能喝吗听说致癌';
  w.doRumor();
  ok($('#rumorResult .verdict', d).textContent.includes('假谣言'), '隔夜水 → 假谣言');
  d.getElementById('rumorInput').value = '每年输液通血管';
  w.doRumor();
  ok($('#rumorResult .verdict', d).textContent.includes('危险'), '输液通血管 → 危险级');
  d.getElementById('rumorInput').value = '公园的花开了';
  w.doRumor();
  ok($('#rumorResult .verdict', d).textContent.includes('没查到 ≠ 是真的'), '未命中绝不判真假（R-01 对策）');
  ok(!!$('#rumorResult .verdict .chip', d), '未命中给「去防骗」互导链接');
  w.chipUse('rumor', '降压');
  ok(d.getElementById('rumorInput').value === '降压', 'chipUse 填入输入框');
  ok($('#rumorResult .verdict', d).textContent.includes('夸大'), '「降压」快捷词命中规则（承诺兑现）');

  /* ---------- 5. 单元：matchRules 得分排序 ---------- */
  section('单元 · matchRules');
  const m1 = w.matchRules(w.RUMOR_RULES, '保健品能代替药物吗');
  ok(m1.length >= 1 && m1[0].score >= 2, '多关键词命中得分累加（保健品+代替药）');
  const m2 = w.matchRules(w.FRAUD_RULES, '完全无关的句子');
  ok(m2.length === 0, '无命中返回空数组');

  /* ---------- 6. 搜索（大小写不敏感修复） ---------- */
  section('搜索');
  d.getElementById('searchInput').value = 'wifi';
  w.onSearch('wifi');
  const wifiCount = $$('#searchResults .sr-item').length;
  ok(wifiCount > 0, '小写 wifi 能搜到「连接WiFi」（大小写不敏感）');
  w.onSearch('视频');
  ok($$('#searchResults .sr-item').length >= 2, '中文关键词「视频」有多结果');
  w.onSearch('绝不存在的词xyz');
  ok($('#searchResults .empty', d) && !$('#searchResults .empty script', d), '无结果显示空态');
  d.getElementById('searchInput').value = '<img src=x onerror=1>';
  w.onSearch('<img src=x onerror=1>');
  ok(!$('#searchResults .empty img', d), '用户输入被转义（无 HTML 注入）');

  /* ---------- 7. 收藏持久化 ---------- */
  section('收藏');
  w.switchTab('home'); w.openTut('wx-video');
  w.toggleFav();
  ok($('#favBtn', d).textContent === '❤️', '收藏按钮变红心');
  ok(JSON.parse(w.localStorage.getItem('ylz_favs') || '[]').indexOf('wx-video') >= 0, '收藏写入 localStorage');
  w.toggleFav();
  ok(JSON.parse(w.localStorage.getItem('ylz_favs') || '[]').indexOf('wx-video') < 0, '再点取消收藏');
  w.toggleFav(); w.switchTab('favs');
  ok($$('#favList .list-item').length === 1, '收藏页显示 1 条');
  w.delFav('wx-video');
  ok($$('#favList .list-item').length === 0 && $('#favList .empty', d), '删除后空态引导');

  /* ---------- 8. 设置：字号与开关 ---------- */
  section('设置');
  w.setFont('large');
  ok(d.documentElement.className === 'font-large', '大字号 → html 类切换');
  ok(w.localStorage.getItem('ylz_font') === 'large', '字号偏好持久化');
  w.setFont('medium');
  ok(d.documentElement.className === 'font-medium', '恢复中字号');
  w.setAutoTts(false);
  ok(w.localStorage.getItem('ylz_autotts') === '0', '自动朗读开关持久化');

  /* ---------- 9. 隐私模式容错 ---------- */
  section('隐私模式容错');
  const origSet = w.localStorage.setItem.bind(w.localStorage);
  w.localStorage.setItem = () => { throw new Error('QuotaExceeded'); };
  let threw = false;
  try { w.setAutoTts(true); w.toggleFav(); } catch (e) { threw = true; }
  ok(!threw, 'localStorage 抛错时功能不崩（lsSet 封装）');
  w.localStorage.setItem = origSet;

  console.log('\n' + (fail === 0
    ? '\u2705 全部 ' + pass + ' 项断言通过'
    : '\u274c ' + fail + ' 项失败（通过 ' + pass + '）'));
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('套件运行失败:', e); process.exit(1); });
