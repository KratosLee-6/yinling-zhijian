#!/usr/bin/env node
/* ============================================================
 * 银龄指尖 · 教学示意图生成器（M1 内容生产线）
 * - 定制场景：微信视频通话 4 步（sceneWxVideo*）
 * - 通用场景引擎：按步骤文案自动分类，全量覆盖所有教程
 *     open 打开应用 / tap 点【按钮】/ type 输入 / done 完成 / focus 通用操作
 * - 产出：assets/steps/<教程id>-<步>.svg（360x560，红圈标注，右下角标「示意图」）
 * - 注册表：data/step-imgs.js（STEP_IMGS[tutId] = 步数，勿手改）
 * - 用法：node tools/make-diagrams.js（无第三方依赖）
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'steps');
const DATA = require(path.join(ROOT, 'data', 'tutorials.js'));
fs.mkdirSync(OUT, { recursive: true });

/* ---------- 通用常量 ---------- */
const W = 360, H = 560;
const RED = '#E53935', GREEN = '#07C160', CREAM = '#F5EDE8';
const FONT = 'font-family="PingFang SC,Microsoft YaHei,sans-serif"';
const PHONE = { x: 34, y: 12, w: 292, h: 486, rx: 26 };
const SCR = { x: PHONE.x + 7, y: PHONE.y + 7, w: PHONE.w - 14, h: PHONE.h - 14, rx: 20 };

/* ---------- 基础工具 ---------- */
function txt(x, y, s, size, fill, opts = {}) {
  const w = opts.bold ? ' font-weight="bold"' : '';
  const anchor = opts.anchor ? ' text-anchor="' + opts.anchor + '"' : '';
  return '<text x="' + x + '" y="' + y + '" fill="' + fill + '" font-size="' + size + '"' + w + anchor + ' ' + FONT + '>' + s + '</text>';
}
function rrect(x, y, w, h, r, fill, extra = '') {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
}
function circle(cx, cy, r, fill, extra = '') {
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>';
}

/* ---------- 标注组件 ---------- */
function redRing(cx, cy, r) {
  /* circle() 第 4 参已置 fill='none'，extra 里不能再写 fill（重复属性会让 SVG 整体解析失败） */
  return circle(cx, cy, r, 'none', 'stroke="' + RED + '" stroke-width="4" stroke-dasharray="10,7"');
}
function redBox(x, y, w, h, r) {
  return rrect(x, y, w, h, r, 'none', 'stroke="' + RED + '" stroke-width="4" stroke-dasharray="10,7"');
}
function redArrow(x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1), hl = 14, hw = 9;
  const bx = x2 - hl * Math.cos(a), by = y2 - hl * Math.sin(a);
  const p1 = [x2, y2],
        p2 = [bx - hw * Math.sin(a), by + hw * Math.cos(a)],
        p3 = [bx + hw * Math.sin(a), by - hw * Math.cos(a)];
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + bx + '" y2="' + by + '" stroke="' + RED + '" stroke-width="5" stroke-linecap="round"/>'
    + '<polygon points="' + p1.join(',') + ' ' + p2.join(',') + ' ' + p3.join(',') + '" fill="' + RED + '"/>';
}
function tapDot(cx, cy) {
  return circle(cx, cy, 14, RED, 'opacity="0.25"') + circle(cx, cy, 7, RED);
}
function noteTag(x, y, s) {
  const w = [...s].length * 14 + 18;
  return rrect(x, y, w, 30, 15, RED) + txt(x + w / 2, y + 21, s, 15, '#fff', { bold: true, anchor: 'middle' });
}
function centerNote(s) { return noteTag((W - ([...s].length * 14 + 18)) / 2, 452, s); }

/* ---------- 手机骨架 ---------- */
function phoneFrame(inner) {
  const sx = SCR.x, sy = SCR.y;
  return rrect(PHONE.x, PHONE.y, PHONE.w, PHONE.h, PHONE.rx, '#2B2B2B')
    + '<clipPath id="scr"><rect x="' + sx + '" y="' + sy + '" width="' + SCR.w + '" height="' + SCR.h + '" rx="' + SCR.rx + '"/></clipPath>'
    + '<g clip-path="url(#scr)">' + inner + '</g>'
    + '<rect x="' + sx + '" y="' + sy + '" width="' + SCR.w + '" height="' + SCR.h + '" rx="' + SCR.rx + '" fill="none" stroke="#555" stroke-width="1.5"/>';
}
function statusBar(dark) {
  const c = dark ? '#fff' : '#111';
  let s = txt(SCR.x + 16, SCR.y + 15, '9:41', 12, c, { bold: true });
  s += rrect(SCR.x + SCR.w - 34, SCR.y + 7, 22, 11, 3, 'none', 'stroke="' + c + '" stroke-width="1.5"')
     + rrect(SCR.x + SCR.w - 32, SCR.y + 9, 14, 7, 1.5, c)
     + circle(SCR.x + SCR.w - 38, SCR.y + 12.5, 1.6, c);
  return s;
}

/* ---------- App 顶部栏（通用场景用） ---------- */
function appHeader(meta) {
  const tc = meta.darkText ? '#111' : '#fff';
  let s = rrect(SCR.x, SCR.y, SCR.w, 50, 0, meta.color);
  s += rrect(SCR.x + 12, SCR.y + 11, 28, 28, 8, '#fff', 'opacity="0.25"');
  s += txt(SCR.x + 26, SCR.y + 32, meta.emoji, 18, tc, { anchor: 'middle' });
  s += txt(SCR.x + 50, SCR.y + 32, meta.name, 17, tc, { bold: true });
  return s;
}
function mutedRows(n, y0) { /* 灰色内容占位行，暗示「这是App内容区」 */
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + i * 52;
    s += rrect(SCR.x + 12, y, 34, 34, 8, '#EDEDED') + rrect(SCR.x + 56, y + 3, 120, 10, 5, '#EDEDED') + rrect(SCR.x + 56, y + 20, 78, 9, 4.5, '#F4F4F4');
  }
  return s;
}

/* ============================================================
 * 定制场景：微信视频通话（最高频教程，按真实微信 UI 手绘）
 * ============================================================ */
function wxNav(title, opts = {}) {
  let s = rrect(SCR.x, SCR.y, SCR.w, 46, 0, '#F7F7F7');
  s += txt(SCR.x + SCR.w / 2, SCR.y + 30, title, 18, '#111', { bold: true, anchor: 'middle' });
  if (opts.back) s += '<path d="M ' + (SCR.x + 26) + ' ' + (SCR.y + 23) + ' l 12 -11 l 12 11" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  if (opts.plus) s += txt(SCR.x + SCR.w - 24, SCR.y + 32, '+', 24, '#111', { bold: true, anchor: 'middle' });
  return s;
}
function avatar(cx, cy, r, color, ch) {
  return circle(cx, cy, r, color) + txt(cx, cy + r * 0.36, ch, Math.round(r * 0.9), '#fff', { bold: true, anchor: 'middle' });
}
function chatRow(y, name, preview, time, avColor, avChar) {
  let s = avatar(SCR.x + 40, y + 32, 22, avColor, avChar);
  s += txt(SCR.x + 74, y + 24, name, 16, '#111', { bold: true })
    + txt(SCR.x + 74, y + 46, preview, 13, '#999')
    + txt(SCR.x + SCR.w - 14, y + 22, time, 11, '#BBB', { anchor: 'end' })
    + '<line x1="' + (SCR.x + 74) + '" y1="' + (y + 62) + '" x2="' + (SCR.x + SCR.w - 12) + '" y2="' + (y + 62) + '" stroke="#EEE" stroke-width="1"/>';
  return s;
}
function bubble(x, y, w, text, side, lines) {
  const h = 20 + lines * 20;
  const fill = side === 'me' ? GREEN : '#fff';
  const tc = side === 'me' ? '#fff' : '#111';
  let s = rrect(x, y, w, h, 10, fill);
  for (let i = 0; i < lines; i++) s += txt(x + 14, y + 30 + i * 20, text, 14, tc);
  return s;
}
function inputBar() {
  const y = SCR.y + SCR.h - 52;
  let s = rrect(SCR.x, y, SCR.w, 52, 0, '#F7F7F7')
    + rrect(SCR.x + 12, y + 10, SCR.w - 100, 32, 6, '#fff', 'stroke="#E5E5E5"')
    + circle(SCR.x + SCR.w - 58, y + 26, 13, 'none', 'stroke="#4A4A4A" stroke-width="2"')
    + '<path d="M ' + (SCR.x + SCR.w - 58) + ' ' + (y + 20) + ' a 6 6 0 0 1 6 6 a 6 6 0 0 1 -12 0 z" fill="#4A4A4A"/>';
  const pcx = SCR.x + SCR.w - 28, pcy = y + 26;
  s += circle(pcx, pcy, 15, 'none', 'stroke="#4A4A4A" stroke-width="2"')
    + '<line x1="' + (pcx - 8) + '" y1="' + pcy + '" x2="' + (pcx + 8) + '" y2="' + pcy + '" stroke="#4A4A4A" stroke-width="2.5"/>'
    + '<line x1="' + pcx + '" y1="' + (pcy - 8) + '" x2="' + pcx + '" y2="' + (pcy + 8) + '" stroke="#4A4A4A" stroke-width="2.5"/>';
  return { svg: s, plus: { x: pcx, y: pcy } };
}
function sceneWxVideo1() {
  let s = statusBar(false) + wxNav('微信', { plus: true });
  s += rrect(SCR.x + 12, SCR.y + 56, SCR.w - 24, 30, 15, '#EDEDED') + txt(SCR.x + 34, SCR.y + 76, '搜索', 13, '#999');
  s += chatRow(SCR.y + 96, '张阿姨', '闺女，周末回来吃饭不', '现在', '#F5A623', '张');
  s += chatRow(SCR.y + 160, '老李', '明天去公园走走吗', '昨天', '#5B8DEF', '李');
  s += chatRow(SCR.y + 224, '家人群', '二叔：收到收到', '周三', '#9B59B6', '家');
  s += chatRow(SCR.y + 288, '视频号', '为你推荐', '周一', '#16A085', '视');
  s += redBox(SCR.x + 10, SCR.y + 92, SCR.w - 20, 64, 12);
  s += tapDot(SCR.x + 40, SCR.y + 128);
  s += redArrow(SCR.x + SCR.w + 6, SCR.y + 60, SCR.x + SCR.w - 30, SCR.y + 100);
  s += noteTag(SCR.x + 96, SCR.y + 380, '点开张阿姨');
  return phoneFrame(s);
}
function sceneWxVideo2() {
  let s = statusBar(false) + wxNav('张阿姨', { back: true });
  s += txt(SCR.x + SCR.w / 2, SCR.y + 62, '22:30', 11, '#AAA', { anchor: 'middle' });
  s += bubble(SCR.x + 14, SCR.y + 74, 150, '小王啊，最近', 'ta', 1);
  s += bubble(SCR.x + 14, SCR.y + 114, 168, '周末回来吃饭不？', 'ta', 1);
  s += bubble(SCR.x + SCR.w - 150, SCR.y + 160, 136, '好嘞阿姨！', 'me', 1);
  const bar = inputBar();
  s += bar.svg;
  s += redRing(bar.plus.x, bar.plus.y - 2, 26);
  s += tapDot(bar.plus.x, bar.plus.y - 2);
  s += redArrow(SCR.x + SCR.w + 6, SCR.y + SCR.h - 90, bar.plus.x + 24, bar.plus.y - 16);
  s += noteTag(SCR.x + 96, SCR.y + 330, '点这个加号');
  return phoneFrame(s);
}
function sceneWxVideo3() {
  let bg = bubble(SCR.x + 14, SCR.y + 74, 150, '小王啊，最近', 'ta', 1)
    + bubble(SCR.x + SCR.w - 150, SCR.y + 120, 136, '好嘞阿姨！', 'me', 1);
  const bar = inputBar();
  bg = statusBar(false) + wxNav('张阿姨', { back: true }) + bg + bar.svg;
  let s = bg + rrect(SCR.x, SCR.y, SCR.w, SCR.h, 0, '#000', 'opacity="0.45"');
  const sheetY = SCR.y + 150;
  s += rrect(SCR.x, sheetY, SCR.w, SCR.h - 150, 14, '#fff');
  s += txt(SCR.x + 20, sheetY + 34, '更多功能', 15, '#999');
  const tiles = [
    { label: '相册', icon: 'album', hot: false },
    { label: '视频通话', icon: 'video', hot: true },
    { label: '语音通话', icon: 'voice', hot: false },
    { label: '位置', icon: 'pin', hot: false },
    { label: '红包', icon: 'packet', hot: false },
    { label: '收藏', icon: 'star', hot: false },
  ];
  const tw = 76, gap = (SCR.w - tw * 3) / 4, th = 76;
  tiles.forEach((t, i) => {
    const cx = SCR.x + gap + (i % 3) * (tw + gap), cy = sheetY + 52 + Math.floor(i / 3) * (th + 26);
    const icx = cx + tw / 2, icy = cy + th / 2;
    s += rrect(cx, cy, tw, th, 16, t.hot ? GREEN : '#F2F2F2');
    let icon = '';
    if (t.icon === 'video') {
      icon = rrect(icx - 17, icy - 10, 26, 20, 5, '#fff') + '<polygon points="' + (icx + 9) + ',' + (icy - 8) + ' ' + (icx + 18) + ',' + (icy - 14) + ' ' + (icx + 18) + ',' + (icy + 14) + ' ' + (icx + 9) + ',' + (icy + 8) + '" fill="#fff"/>';
    } else if (t.icon === 'voice') {
      icon = '<path d="M ' + (icx - 14) + ' ' + (icy - 6) + ' q 0 -10 10 -8 q 8 2 8 8 q 0 6 -6 10 l -4 4 l -8 -8 l 4 -4 q -4 -2 -4 -2 z" fill="' + (t.hot ? '#fff' : '#8A8A8A') + '" transform="rotate(-40 ' + icx + ' ' + icy + ')"/>';
    } else if (t.icon === 'album') {
      icon = '<circle cx="' + (icx - 6) + '" cy="' + (icy - 6) + '" r="4" fill="' + (t.hot ? '#fff' : '#8A8A8A') + '"/><polygon points="' + (icx - 16) + ',' + (icy + 10) + ' ' + (icx - 2) + ',' + (icy - 6) + ' ' + (icx + 6) + ',' + (icy + 10) + '" fill="' + (t.hot ? '#fff' : '#8A8A8A') + '"/>';
    } else if (t.icon === 'pin') {
      icon = '<path d="M ' + icx + ' ' + (icy + 14) + ' l -9 -13 a 9 9 0 1 1 18 0 z" fill="' + (t.hot ? '#fff' : '#8A8A8A') + '"/><circle cx="' + icx + '" cy="' + (icy - 4) + '" r="3.5" fill="' + (t.hot ? GREEN : '#fff') + '"/>';
    } else if (t.icon === 'packet') {
      icon = rrect(icx - 13, icy - 15, 26, 30, 6, '#E64A3C') + circle(icx, icy, 5, '#F8D24A');
    } else {
      icon = '<polygon points="' + icx + ',' + (icy - 13) + ' ' + (icx + 4) + ',' + (icy - 4) + ' ' + (icx + 14) + ',' + (icy - 4) + ' ' + (icx + 6) + ',' + (icy + 2) + ' ' + (icx + 9) + ',' + (icy + 12) + ' ' + icx + ',' + (icy + 6) + ' ' + (icx - 9) + ',' + (icy + 12) + ' ' + (icx - 6) + ',' + (icy + 2) + ' ' + (icx - 14) + ',' + (icy - 4) + ' ' + (icx - 4) + ',' + (icy - 4) + '" fill="' + (t.hot ? '#fff' : '#8A8A8A') + '"/>';
    }
    s += icon + txt(icx, cy + th + 18, t.label, 14, t.hot ? GREEN : '#666', { bold: t.hot, anchor: 'middle' });
    if (t.hot) {
      const ccx = cx + tw / 2, ccy = cy + (th + 22) / 2 + 8;
      s += redRing(ccx, ccy, 56);
      s += tapDot(ccx, ccy + 14);
    }
  });
  return phoneFrame(s);
}
function sceneWxVideo4() {
  let s = rrect(SCR.x, SCR.y, SCR.w, SCR.h, 0, '#1E1E1E');
  s += statusBar(true);
  s += rrect(SCR.x + SCR.w - 84, SCR.y + 26, 68, 92, 10, '#3A3A3A') + avatar(SCR.x + SCR.w - 50, SCR.y + 72, 24, '#5B8DEF', '我');
  const cx = SCR.x + SCR.w / 2, cy = SCR.y + 170;
  s += avatar(cx, cy, 52, '#F5A623', '张');
  s += txt(cx, cy + 84, '张阿姨', 18, '#fff', { bold: true, anchor: 'middle' });
  s += txt(cx, cy + 112, '等待对方接受邀请…', 15, '#E8E8E8', { anchor: 'middle' });
  s += txt(cx, cy + 134, '对方手机正在响铃', 12, '#9A9A9A', { anchor: 'middle' });
  const by = SCR.y + SCR.h - 96;
  const btns = [
    { x: cx - 96, label: '静音', icon: 'mic' },
    { x: cx, label: '挂断', icon: 'hangup' },
    { x: cx + 96, label: '摄像头', icon: 'flip' },
  ];
  btns.forEach(b => {
    const isHangup = b.icon === 'hangup';
    s += circle(b.x, by, 27, isHangup ? '#F5544E' : '#4A4A4A');
    if (isHangup) {
      s += '<path d="M ' + (b.x - 12) + ' ' + (b.y - 4) + ' q 0 -9 9 -7 q 7 2 7 7 q 0 5 -5 9 l -3 3 l -7 -7 l 3 -3 q -4 -2 -4 -2 z" fill="#fff" transform="rotate(135 ' + b.x + ' ' + b.y + ')"/>';
    } else if (b.icon === 'mic') {
      s += rrect(b.x - 5, b.y - 12, 10, 17, 5, '#fff') + '<path d="M ' + (b.x - 10) + ' ' + b.y + ' a 10 10 0 0 0 20 0" stroke="#fff" stroke-width="2.5" fill="none"/><line x1="' + b.x + '" y1="' + (b.y + 10) + '" x2="' + b.x + '" y2="' + (b.y + 15) + '" stroke="#fff" stroke-width="2.5"/>';
    } else {
      s += rrect(b.x - 12, b.y - 9, 18, 18, 4, '#fff') + '<polygon points="' + (b.x + 7) + ',' + (b.y - 7) + ' ' + (b.x + 15) + ',' + (b.y - 12) + ' ' + (b.x + 15) + ',' + (b.y + 12) + ' ' + (b.x + 7) + ',' + (b.y + 7) + '" fill="#fff"/>' + '<path d="M ' + (b.x + 14) + ' ' + (b.y + 14) + ' a 8 8 0 1 1 2 -10" stroke="#fff" stroke-width="2" fill="none"/>';
    }
    s += txt(b.x, by + 46, b.label, 13, '#E8E8E8', { anchor: 'middle' });
  });
  s += redRing(cx, cy + 108, 86);
  s += redArrow(SCR.x + SCR.w + 6, SCR.y + 250, cx + 76, cy + 108);
  s += noteTag(SCR.x + 92, SCR.y + 330, '耐心等她接');
  s += redRing(cx, by, 34) + txt(cx + 44, by + 60, '拨错了点红色挂断', 12, '#FF8A80');
  return phoneFrame(s);
}
/* ============================================================
 * 通用场景引擎
 * ============================================================ */
function parseStep(d) {
  const btns = [...d.matchAll(/【([^】]+)】/g)].map(m => m[1]);
  let pos = 'center';
  if (/右下角|右下方/.test(d)) pos = 'br';
  else if (/左下角/.test(d)) pos = 'bl';
  else if (/右上角/.test(d)) pos = 'tr';
  else if (/左上角/.test(d)) pos = 'tl';
  else if (/底部|下方|下面/.test(d)) pos = 'bottom';
  else if (/顶部|上方|上面/.test(d)) pos = 'top';
  let kind = 'focus';
  if (/^打开|^回到桌面|^找到/.test(d) && !btns.length) kind = 'open';
  else if (btns.length) kind = 'tap';
  else if (/输入|填写|^填|打字/.test(d)) kind = 'type';
  else if (/等待|^等|收到|成功|就是|完成|学会了/.test(d)) kind = 'done';
  return { btns, pos, kind };
}
/* 按钮位置 → 坐标（屏幕内） */
function posXY(pos, btnW, btnH) {
  const m = {
    br:     { x: SCR.x + SCR.w - btnW - 18, y: SCR.y + 300 },
    bl:     { x: SCR.x + 18,                y: SCR.y + 300 },
    tr:     { x: SCR.x + SCR.w - btnW - 18, y: SCR.y + 66 },
    tl:     { x: SCR.x + 18,                y: SCR.y + 66 },
    top:    { x: SCR.x + (SCR.w - btnW)/2,  y: SCR.y + 66 },
    bottom: { x: SCR.x + (SCR.w - btnW)/2,  y: SCR.y + 330 },
    center: { x: SCR.x + (SCR.w - btnW)/2,  y: SCR.y + 200 },
  };
  return m[pos] || m.center;
}
function sceneOpen(meta, parsed) {
  let s = statusBar(false) + appHeader(meta);
  const cx = SCR.x + SCR.w / 2, cy = SCR.y + 200;
  s += rrect(cx - 52, cy - 52, 104, 104, 24, meta.color);
  s += txt(cx, cy + 16, meta.emoji, 52, '#fff', { anchor: 'middle' });
  s += txt(cx, cy + 92, meta.name, 20, '#111', { bold: true, anchor: 'middle' });
  s += redRing(cx, cy, 74) + tapDot(cx, cy);
  s += redArrow(SCR.x + SCR.w + 6, SCR.y + 120, cx + 50, cy - 40);
  s += centerNote('在手机上找到它，点开');
  return phoneFrame(s);
}
function sceneTap(meta, parsed) {
  let s = statusBar(false) + appHeader(meta);
  s += mutedRows(3, SCR.y + 70);
  const label = parsed.btns[0];
  const chars = [...label].length;
  const btnW = Math.min(250, Math.max(140, chars * 24 + 44));
  const btnH = 56;
  const p = posXY(parsed.pos, btnW, btnH);
  const tc = meta.darkText ? '#111' : '#fff';
  /* 若有第二个【】按钮，画在旁边作陪衬（不圈） */
  if (parsed.btns[1]) {
    const l2 = parsed.btns[1];
    const w2 = Math.min(230, Math.max(120, [...l2].length * 22 + 36));
    s += rrect(SCR.x + (SCR.w - w2) / 2, SCR.y + 260, w2, 48, 24, '#E8E8E8')
      + txt(SCR.x + SCR.w / 2, SCR.y + 291, l2, 17, '#888', { bold: true, anchor: 'middle' });
  }
  s += rrect(p.x, p.y, btnW, btnH, 28, meta.color);
  s += txt(p.x + btnW / 2, p.y + 37, label, 21, tc, { bold: true, anchor: 'middle' });
  const cx = p.x + btnW / 2, cy = p.y + btnH / 2;
  s += redRing(cx, cy, Math.max(btnW, btnH) / 2 + 16);
  s += tapDot(cx, cy);
  s += redArrow(SCR.x + SCR.w + 6, Math.max(SCR.y + 70, cy - 90), cx + Math.max(btnW, btnH) / 2 - 8, cy - 18);
  s += centerNote('认准这几个字再点');
  return phoneFrame(s);
}
function sceneType(meta, parsed) {
  let s = statusBar(false) + appHeader(meta);
  s += mutedRows(2, SCR.y + 70);
  /* 输入框 */
  const iy = SCR.y + 210;
  s += rrect(SCR.x + 14, iy, SCR.w - 28, 54, 10, '#fff', 'stroke="#D8D8D8" stroke-width="1.5"');
  s += txt(SCR.x + 30, iy + 34, '点这里打字', 17, '#BBB');
  s += '<line x1="' + (SCR.x + 138) + '" y1="' + (iy + 14) + '" x2="' + (SCR.x + 138) + '" y2="' + (iy + 40) + '" stroke="' + RED + '" stroke-width="3"/>';
  s += redRing(SCR.x + SCR.w / 2, iy + 27, 110);
  s += tapDot(SCR.x + 60, iy + 27);
  /* 迷你键盘 */
  const ky = SCR.y + 300;
  s += rrect(SCR.x, ky, SCR.w, SCR.h - (ky - SCR.y), 0, '#D1D3D9');
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const kx = SCR.x + 8 + c * 38, kyy = ky + 10 + r * 40;
      s += rrect(kx, kyy, 34, 34, 6, '#fff');
    }
  }
  s += rrect(SCR.x + 60, ky + 134, SCR.w - 120, 34, 6, '#ABB0BA') + txt(SCR.x + SCR.w / 2, ky + 157, '空格', 14, '#333', { anchor: 'middle' });
  s += redArrow(SCR.x + SCR.w + 6, iy - 30, SCR.x + SCR.w - 40, iy + 10);
  s += centerNote('点白框，用键盘打字');
  return phoneFrame(s);
}
function sceneDone(meta, parsed, d) {
  let s = statusBar(false) + appHeader(meta);
  const cx = SCR.x + SCR.w / 2, cy = SCR.y + 150;
  s += circle(cx, cy, 44, GREEN, 'opacity="0.15"');
  s += '<path d="M ' + (cx - 20) + ' ' + cy + ' l 14 14 l 26 - 28" stroke="' + GREEN + '" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
  s += rrect(SCR.x + 24, cy + 60, SCR.w - 48, 74, 14, '#fff', 'stroke="#E3E3E3" stroke-width="1.5"');
  s += txt(cx, cy + 104, d, 18, '#333', { bold: true, anchor: 'middle' });
  s += redRing(cx, cy, 62);
  s += centerNote('看到这样就成功了');
  return phoneFrame(s);
}
function sceneFocus(meta, parsed, d) {
  let s = statusBar(false) + appHeader(meta);
  s += mutedRows(2, SCR.y + 70);
  const cy = SCR.y + 220;
  s += rrect(SCR.x + 20, cy - 44, SCR.w - 40, 96, 16, '#fff', 'stroke="#E3E3E3" stroke-width="1.5"');
  /* 长文案换行（≤15 字，两行足够） */
  const chars = [...d];
  if (chars.length > 8) {
    const l1 = chars.slice(0, Math.ceil(chars.length / 2)).join('');
    const l2 = chars.slice(Math.ceil(chars.length / 2)).join('');
    s += txt(SCR.x + SCR.w / 2, cy - 6, l1, 19, '#333', { bold: true, anchor: 'middle' });
    s += txt(SCR.x + SCR.w / 2, cy + 24, l2, 19, '#333', { bold: true, anchor: 'middle' });
  } else {
    s += txt(SCR.x + SCR.w / 2, cy + 12, d, 21, '#333', { bold: true, anchor: 'middle' });
  }
  s += redRing(SCR.x + SCR.w / 2, cy, 120);
  s += tapDot(SCR.x + SCR.w / 2, cy + 58);
  s += redArrow(SCR.x + SCR.w + 6, cy - 80, SCR.x + SCR.w / 2 + 92, cy - 34);
  s += centerNote('照着这句话做');
  return phoneFrame(s);
}

/* ---------- 底部说明条 ---------- */
function captionBar(no, text) {
  let s = rrect(20, 508, 320, 44, 22, '#fff', 'stroke="#E8DCD2" stroke-width="1.5"');
  s += circle(46, 530, 15, RED) + txt(46, 536, String(no), 16, '#fff', { bold: true, anchor: 'middle' });
  s += txt(70, 536, text, 17, '#333', { bold: true });
  s += txt(328, 536, '示意图', 11, '#C4B5A5', { anchor: 'end' });
  return s;
}

/* ============================================================
 * 生成主流程：定制表 + 全量通用引擎 + 注册表
 * ============================================================ */
const BESPOKE = {
  'wx-video': [sceneWxVideo1, sceneWxVideo2, sceneWxVideo3, sceneWxVideo4],
};
const APP_META = {
  wechat:  { c: '#07C160' }, taobao:  { c: '#FF5000' }, douyin: { c: '#1C1C1E' },
  amap:    { c: '#0A6CFF' }, '12306': { c: '#2C68FF' }, alipay: { c: '#1677FF' },
  meituan: { c: '#FFC300', dark: true }, social: { c: '#2A5CAA' }, traffic: { c: '#2A6AE9' },
};
const BRAND_META = {
  huawei: '#C7000B', xiaomi: '#FF6900', oppo: '#00995C',
  vivo: '#415FFF', apple: '#3A3A3C', samsung: '#1428A0',
};

function buildSvg(draw, no, caption) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">'
    + '<rect width="' + W + '" height="' + H + '" fill="' + CREAM + '"/>'
    + draw() + captionBar(no, caption) + '</svg>';
}

/* 单标签内同名属性出现两次 = SVG 整体解析失败（曾因 fill 重复翻车），生成期硬拦截 */
function assertNoDupAttrs(svg, file) {
  const tags = svg.match(/<[a-zA-Z][^>]*>/g) || [];
  for (const t of tags) {
    const names = [...t.matchAll(/([a-zA-Z:-]+)\s*=/g)].map(m => m[1]);
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) throw new Error(file + ' 重复属性 ' + dup + ': ' + t.slice(0, 90));
  }
}

const registry = {};
let n = 0, bespokeN = 0;
function emit(file, draw, no, caption) {
  const svg = buildSvg(draw, no, caption);
  assertNoDupAttrs(svg, file);
  fs.writeFileSync(path.join(OUT, file), svg, 'utf8');
  n++;
}

/* 1) 定制教程 */
Object.keys(BESPOKE).forEach(tid => {
  const found = findTut(tid);
  if (!found) throw new Error('定制教程不存在: ' + tid);
  const tut = found.tut;
  BESPOKE[tid].forEach((draw, i) => {
    emit(tid + '-' + (i + 1) + '.svg', draw, i + 1, tut.steps[i].d);
    bespokeN++;
  });
  registry[tid] = tut.steps.length;
});

/* 2) 全量通用引擎 */
function findTut(tid) {
  for (const g of Object.keys(DATA.TUTORIALS)) {
    const hit = DATA.TUTORIALS[g].tuts.find(t => t.id === tid);
    if (hit) return { tut: hit, meta: { name: DATA.TUTORIALS[g].name, emoji: DATA.TUTORIALS[g].emoji, color: (APP_META[g] || {}).c || '#5B8DEF', darkText: !!(APP_META[g] || {}).dark } };
  }
  for (const b of Object.keys(DATA.BRAND_TUTS)) {
    const hit = DATA.BRAND_TUTS[b].find(t => t.id === tid);
    if (hit) return { tut: hit, meta: { name: '手机设置', emoji: '⚙️', color: BRAND_META[b] || '#78909C' } };
  }
  return null;
}
const allTuts = [];
Object.keys(DATA.TUTORIALS).forEach(g => DATA.TUTORIALS[g].tuts.forEach(t => allTuts.push(t.id)));
Object.keys(DATA.BRAND_TUTS).forEach(b => DATA.BRAND_TUTS[b].forEach(t => allTuts.push(t.id)));

for (const tid of allTuts) {
  if (BESPOKE[tid]) continue;
  const found = findTut(tid);
  const tut = found.tut, meta = found.meta;
  tut.steps.forEach((s, i) => {
    const parsed = parseStep(s.d);
    let draw;
    if (parsed.kind === 'open') draw = () => sceneOpen(meta, parsed);
    else if (parsed.kind === 'tap') draw = () => sceneTap(meta, parsed);
    else if (parsed.kind === 'type') draw = () => sceneType(meta, parsed);
    else if (parsed.kind === 'done') draw = () => sceneDone(meta, parsed, s.d);
    else draw = () => sceneFocus(meta, parsed, s.d);
    emit(tid + '-' + (i + 1) + '.svg', draw, i + 1, s.d);
  });
  registry[tid] = tut.steps.length;
}

/* 3) 注册表 */
const regJs = '/* 由 tools/make-diagrams.js 自动生成，勿手改。STEP_IMGS[教程id] = 已配示意图的步数 */\n'
  + 'var STEP_IMGS = ' + JSON.stringify(registry, null, 0) + ';\n'
  + 'if (typeof module !== \'undefined\' && module.exports) module.exports = { STEP_IMGS: STEP_IMGS };\n';
fs.writeFileSync(path.join(ROOT, 'data', 'step-imgs.js'), regJs, 'utf8');

console.log('定制示意图 ' + bespokeN + ' 张 / 通用示意图 ' + (n - bespokeN) + ' 张 / 共 ' + n + ' 张');
console.log('注册表教程数 ' + Object.keys(registry).length + ' 条 -> data/step-imgs.js');
