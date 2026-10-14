#!/usr/bin/env node
/* ============================================================
 * 银龄指尖 · 交付门禁
 * 检查：① JS 语法（acorn 纯解析，语法层不执行）
 *      ② 数据完整性（require 加载仓库内静态数据文件）
 *      ③ 引用资源存在（basename 白名单，防路径穿越）
 * 背景：v5.1 曾出现「两页面 JS 同时损坏却无人发现」——本脚本是防复发门禁
 * 用法：node tools/check.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const root = path.join(__dirname, '..');
let fail = 0, warn = 0;
const ok  = m => console.log('  \u2713 ' + m);
const bad = m => { fail++; console.log('  \u2717 ' + m); };
const note = m => { warn++; console.log('  \u26a0 ' + m); };

function syntaxCheck(src, label) {
  try {
    acorn.parse(src, { ecmaVersion: 'latest' });
    ok(label + ' 语法通过');
    return true;
  } catch (e) {
    bad(label + ' 语法错误: ' + e.message);
    return false;
  }
}

console.log('[1/3] JS 语法（acorn 解析，不执行）');
const dataSrc = fs.readFileSync(path.join(root, 'data', 'tutorials.js'), 'utf8');
const appSrc  = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html    = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let pass = syntaxCheck(dataSrc, 'data/tutorials.js');
pass = syntaxCheck(appSrc, 'app.js') && pass;
// index.html 内如有内联脚本也一并解析（当前为 0，防御未来回退）
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
inline.forEach((m, i) => { pass = syntaxCheck(m[1], 'index.html 内联 script#' + (i + 1)) && pass; });
if (!inline.length) ok('index.html 无内联脚本（逻辑已外置）');
if (!pass) { console.log('\u274c 语法未通过，先行退出'); process.exit(1); }

console.log('[2/3] 教程数据完整性');
const D = require(path.join(root, 'data', 'tutorials.js'));
if (!D.APPS || !D.BRANDS || !D.BRAND_TUTS || !D.TUTORIALS || !D.FRAUD_RULES) {
  bad('缺少核心数据对象（APPS/BRANDS/BRAND_TUTS/TUTORIALS/FRAUD_RULES）'); process.exit(1);
}

let tutCount = 0, stepCount = 0, hintCount = 0, imgCount = 0;
const ids = new Set();
const problems = [];
/* M1 教学示意图：只允许 assets/steps/ 下的白名单文件名，防路径穿越 */
const STEP_IMG_OK = /^assets\/steps\/[a-z0-9\-]+\.svg$/;
function walkTuts(list) {
  list.forEach(t => {
    tutCount++;
    if (ids.has(t.id)) problems.push('教程 id 重复: ' + t.id);
    ids.add(t.id);
    if (!t.name) problems.push(t.id + ' 缺 name');
    if (!Array.isArray(t.steps) || t.steps.length < 3) problems.push(t.id + ' 步骤少于 3 步');
    (t.steps || []).forEach((s, i) => {
      stepCount++;
      if (!s.d) problems.push(t.id + ' 第 ' + (i + 1) + ' 步缺文案');
      if (s.hint) hintCount++;
      if (s.img) {
        imgCount++;
        if (!STEP_IMG_OK.test(s.img)) problems.push(t.id + ' 第 ' + (i + 1) + ' 步 img 路径非法: ' + s.img);
        else if (!fs.existsSync(path.join(root, s.img))) problems.push(t.id + ' 第 ' + (i + 1) + ' 步示意图缺失: ' + s.img);
      }
      /* 半角双引号嵌在字符串里正是 v5 两页面同时挂掉的根源（规格：≤15 字，README「改内容须知」） */
      if (s.d && [...s.d].length > 15) problems.push(t.id + ' 第 ' + (i + 1) + ' 步文案超 15 字(' + [...s.d].length + '): ' + s.d);
      if (/["]/.test(s.d + (s.hint || ''))) {
        problems.push(t.id + ' 第 ' + (i + 1) + ' 步含半角双引号（改用「」）: ' + s.d);
      }
    });
  });
}
Object.keys(D.TUTORIALS).forEach(g => walkTuts(D.TUTORIALS[g].tuts));
Object.keys(D.BRAND_TUTS).forEach(g => walkTuts(D.BRAND_TUTS[g]));

ok('软件教程组 ' + Object.keys(D.TUTORIALS).length + ' 个 / 品牌组 ' + Object.keys(D.BRAND_TUTS).length + ' 个');
/* M-03 验收：每个品牌恰好 4 条教程 */
const brandOdd = Object.keys(D.BRAND_TUTS).filter(b => D.BRAND_TUTS[b].length !== 4);
if (brandOdd.length) brandOdd.forEach(b => problems.push('品牌 ' + b + ' 教程数 ≠ 4'));
else ok('6 品牌均为 4 条设置教程（M-03）');
ok('教程总数 ' + tutCount + ' 条 / 步骤总数 ' + stepCount + ' / 带提示语 ' + hintCount + ' / 配示意图 ' + imgCount + ' 步');
if (tutCount < 40) note('教程 ' + tutCount + ' < 40（M-02 目标 ≥40）');
else ok('教程数达到 M-02 目标（≥40）');
if (stepCount < 200) note('步骤 ' + stepCount + ' < 200（M-02 目标 ≥200）');
else ok('步骤数达到 M-02 目标（≥200）');
problems.forEach(bad);
if (!problems.length) ok('id 唯一 / 步骤完整 / 文案无超长 / 无半角引号');

/* ---- 谣言核查库（M-10） ---- */
console.log('[2.5/3] 谣言核查库');
const R = require(path.join(root, 'data', 'rumors.js'));
const RUMOR_VERDICTS = ['假谣言', '危险', '误导', '夸大', '官方'];
if (!R.RUMOR_RULES || !Array.isArray(R.RUMOR_RULES)) { bad('RUMOR_RULES 缺失'); process.exit(1); }
if (R.RUMOR_RULES.length < 25) note('核查条目 ' + R.RUMOR_RULES.length + ' < 25（M-10 目标 ≥25）');
else ok('核查库 ' + R.RUMOR_RULES.length + ' 条（M-10 目标 ≥25）');
const rp = [];
const seenKw = new Map();
R.RUMOR_RULES.forEach((r, i) => {
  if (!Array.isArray(r.k) || !r.k.length) rp.push('核查规则 ' + i + ' 缺关键词');
  if (!r.q || !r.v || !r.m || !r.a || !r.c) rp.push('核查规则 ' + i + ' 字段不全（k/q/v/m/a/c）');
  if (!RUMOR_VERDICTS.includes(r.v)) rp.push('核查规则 ' + i + ' 判断值非法: ' + r.v);
  (r.k || []).forEach(kw => {
    if (seenKw.has(kw)) rp.push('关键词跨条目重复: 「' + kw + '」在规则 ' + seenKw.get(kw) + ' 与 ' + i);
    else seenKw.set(kw, i);
    if (/["]/.test(kw)) rp.push('关键词含半角双引号: ' + kw);
  });
  if (/["]/.test((r.q || '') + (r.m || '') + (r.a || ''))) rp.push('核查规则 ' + i + ' 文案含半角双引号（改用「」）');
});
rp.forEach(bad);
if (!rp.length) ok('字段完整 / 判断值合法 / 关键词无跨条目重复 / 无半角引号');
/* 04-方案设计 §7.5：危险级条目的建议语必须含「问医生/遵医嘱」 */
R.RUMOR_RULES.filter(r => r.v === '危险').forEach(r => {
  if (!/问医生|遵医嘱/.test(r.a)) bad('危险级条目缺「先问医生」固定语: ' + r.q);
});
ok('危险级条目均含「问医生/遵医嘱」固定语');
ok('辟谣三问 ' + (R.RUMOR_3QUESTIONS || []).length + ' 条');

/* 快捷词是界面上对老人的承诺：每个词必须至少命中一条对应规则的关键词 */
function chipHitsRule(chip, rules) {
  return rules.some(r => (r.k || []).some(kw => chip.indexOf(kw) >= 0));
}
(D.FRAUD_CHIPS || []).forEach(c => { if (!chipHitsRule(c, D.FRAUD_RULES)) bad('防骗快捷词无命中规则: ' + c); });
(D.RUMOR_CHIPS || []).forEach(c => { if (!chipHitsRule(c, R.RUMOR_RULES)) bad('辟谣快捷词无命中规则: ' + c); });
ok('防骗/辟谣快捷词均可命中规则');

console.log('[3/3] 防骗话术库 + 页面引用');
if (D.FRAUD_RULES.length < 20) note('话术 ' + D.FRAUD_RULES.length + ' 条 < 20（M-06 目标 ≥20）');
else ok('话术库 ' + D.FRAUD_RULES.length + ' 条（M-06 目标 ≥20）');
const fp = [];
D.FRAUD_RULES.forEach((r, i) => {
  if (!Array.isArray(r.k) || !r.k.length) fp.push('规则 ' + i + ' 缺关键词');
  if (!r.q || !r.v || !r.m || !r.a) fp.push('规则 ' + i + ' 字段不全（q/v/m/a）');
  /* 半角引号红线同样覆盖防骗库（此前只扫教程与谣言库，属门禁缺口） */
  if (/["]/.test((r.q || '') + (r.m || '') + (r.a || ''))) fp.push('防骗规则 ' + i + ' 文案含半角双引号');
});
(D.FRAUD_TOP_TIPS || []).forEach((t, i) => { if (/["]/.test(t.text || '')) fp.push('口诀 ' + i + ' 含半角双引号'); });
(D.FRAUD_3QUESTIONS || []).forEach((q, i) => { if (/["]/.test(q)) fp.push('三问 ' + i + ' 含半角双引号'); });
fp.forEach(bad);
if (!fp.length) ok('话术库字段齐全，防骗内容无半角引号');

if (!/<script src="data\/tutorials\.js">/.test(html)) bad('index.html 未引入 data/tutorials.js');
else ok('index.html 已引入数据层');
if (!/<script src="data\/rumors\.js">/.test(html)) bad('index.html 未引入 data/rumors.js（M-10）');
else ok('index.html 已引入谣言核查库');
if (!/<script src="data\/step-imgs\.js">/.test(html)) bad('index.html 未引入 data/step-imgs.js（M1 示意图注册表）');
else ok('index.html 已引入示意图注册表');
if (!/<script src="data\/realshots\.js">/.test(html)) bad('index.html 未引入 data/realshots.js（商店真机截图注册表）');
else ok('index.html 已引入真机截图注册表');
if (!/<script src="data\/help-links\.js">/.test(html)) bad('index.html 未引入 data/help-links.js（官方手册链接）');
else ok('index.html 已引入官方手册链接');

/* ---- 官方手册链接：官方域名白名单 + 全覆盖 ---- */
const HL = require(path.join(root, 'data', 'help-links.js'));
const OFFICIAL_DOMAINS = ['kf.qq.com', 'weixin.qq.com', 'cshall.alipay.com', '12306.cn', 'douyin.com', 'amap.com', 'meituan.com', '12333.gov.cn', '122.gov.cn', 'taobao.com', 'huawei.com', 'mi.com', 'oppo.com', 'vivo.com.cn', 'apple.com', 'samsung.com.cn'];
const hlProblems = [];
function hlCheck(group, key, label) {
  const h = (HL.HELP_LINKS[group] || {})[key];
  if (!h || !h.url) { hlProblems.push(label + ' 缺官方手册链接'); return; }
  let host = '';
  try { host = new URL(h.url).hostname; } catch (e) { hlProblems.push(label + ' 官方手册 URL 非法: ' + h.url); return; }
  if (!OFFICIAL_DOMAINS.some(d => host === d || host.endsWith('.' + d))) hlProblems.push(label + ' 官方手册域名不在白名单: ' + host);
  if (!h.name) hlProblems.push(label + ' 官方手册缺名称');
}
Object.keys(D.TUTORIALS).forEach(g => hlCheck('apps', g, '教程组 ' + g));
D.BRANDS.forEach(b => hlCheck('brands', b.id, '品牌 ' + b.id));
hlProblems.forEach(bad);
if (!hlProblems.length) ok('官方手册链接 15 个全覆盖（9 App + 6 品牌，官方域名白名单通过）');

/* ---- 商店真机截图一致性 ---- */
const RS = require(path.join(root, 'data', 'realshots.js'));
const rsProblems = [];
Object.keys(RS.REAL_SHOTS || {}).forEach(appId => {
  for (let i = 1; i <= RS.REAL_SHOTS[appId]; i++) {
    if (!fs.existsSync(path.join(root, 'assets', 'realshots', appId + '-' + i + '.png')))
      rsProblems.push('真机截图缺失: assets/realshots/' + appId + '-' + i + '.png');
  }
});
rsProblems.forEach(bad);
if (!rsProblems.length) {
  const total = Object.values(RS.REAL_SHOTS).reduce((a, b) => a + b, 0);
  ok('商店真机截图 ' + Object.keys(RS.REAL_SHOTS).length + ' 个 App / ' + total + ' 张（注册表一致）');
}
if (!/<script src="app\.js">/.test(html)) bad('index.html 未引入 app.js');
else ok('index.html 已引入逻辑层');

/* ---- M1 教学示意图注册表一致性：id 合法 / 文件存在 / 教程全覆盖 ---- */
const SI = require(path.join(root, 'data', 'step-imgs.js'));
const siProblems = [];
Object.keys(SI.STEP_IMGS || {}).forEach(tid => {
  if (!ids.has(tid)) siProblems.push('注册表含未知教程 id: ' + tid);
  for (let i = 1; i <= (SI.STEP_IMGS[tid] || 0); i++) {
    if (!fs.existsSync(path.join(root, 'assets', 'steps', tid + '-' + i + '.svg')))
      siProblems.push('示意图缺失: assets/steps/' + tid + '-' + i + '.svg');
  }
});
const noImgTuts = [...ids].filter(id => !SI.STEP_IMGS[id]);
if (noImgTuts.length) siProblems.push('未配示意图的教程 ' + noImgTuts.length + ' 条: ' + noImgTuts.slice(0, 5).join(',') + (noImgTuts.length > 5 ? ' …' : ''));
siProblems.forEach(bad);
if (!siProblems.length) {
  const covered = Object.values(SI.STEP_IMGS).reduce((a, b) => a + b, 0);
  ok('教学示意图 ' + Object.keys(SI.STEP_IMGS).length + ' 条教程 / ' + covered + ' 步全覆盖（注册表一致）');
}
/* 04-方案设计 §7.5：辟谣免责声明与双官方核实链接必须存在 */
if (!/就医用药请遵医嘱/.test(html)) bad('辟谣免责声明缺失（就医用药请遵医嘱）');
if (!/piyao\.org\.cn/.test(html) || !/piyao\.kepuchina\.cn/.test(html)) bad('官方核实链接缺失（piyao.org.cn / piyao.kepuchina.cn）');
else ok('辟谣免责声明 + 双官方核实链接存在');
if (/id="page-search"/.test(html)) bad('存在无引用的死页面 #page-search');
else ok('无死页面残留');

['page-home','page-fraud','page-favs','page-settings','page-app','page-brands','page-brandtuts','page-tut']
  .forEach(id => { if (!html.includes('id="' + id + '"')) bad('缺页面骨架 #' + id); });
['openTut','renderStep','toggleSpeakStep','doFraud','doRumor','switchCheckMode','matchRules','toggleFav','setFont','goBack','switchTab']
  .forEach(fn => { if (!appSrc.includes('function ' + fn)) bad('app.js 缺关键函数 ' + fn); });
ok('页面骨架 8 个 / 关键函数 11 个齐全');

// 品牌图标：basename 白名单，杜绝路径穿越
const iconDir = path.join(root, 'assets', 'icons');
D.BRANDS.forEach(b => {
  const name = path.basename(b.icon);
  const target = path.join(iconDir, name);
  if (!target.startsWith(iconDir + path.sep)) bad('非法图标路径: ' + name);
  else if (!fs.existsSync(target)) bad('品牌图标缺失: assets/icons/' + name);
});
ok('品牌图标 ' + D.BRANDS.length + ' 张全部存在（basename 白名单校验）');

// 首页 APP 官方图标存在性（emoji 只是兜底，不是常态）
const missingAppIcons = (D.APPS || []).filter(a => !a.icon);
if (missingAppIcons.length) bad('首页软件缺官方图标（icon 字段）: ' + missingAppIcons.map(a => a.name).join('、'));
else {
  (D.APPS || []).forEach(a => {
    const name = path.basename(a.icon);
    const target = path.join(iconDir, name);
    if (!target.startsWith(iconDir + path.sep) || !fs.existsSync(target)) bad('APP 图标缺失: assets/icons/' + name);
  });
  ok('首页 ' + D.APPS.length + ' 个 APP 官方图标全部存在');
}

let uncovered = 0;
D.APPS.forEach(a => {
  const covered = a.type === 'brand'
    ? Object.keys(D.BRAND_TUTS).length > 0
    : !!(D.TUTORIALS[a.id] && D.TUTORIALS[a.id].tuts.length);
  if (!covered) { bad('首页软件「' + a.name + '」无对应教程数据'); uncovered++; }
});
if (!uncovered) ok('首页 ' + D.APPS.length + ' 个软件均有教程数据');

console.log('');
console.log(fail === 0 ? '\u2705 门禁通过（警告 ' + warn + '）' : '\u274c 门禁未通过：' + fail + ' 处错误');
process.exit(fail === 0 ? 0 : 1);
