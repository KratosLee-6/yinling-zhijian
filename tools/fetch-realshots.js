#!/usr/bin/env node
/* ============================================================
 * 银龄指尖 · 商店真机截图拉取器（M1 真实界面参考）
 * - 来源：iTunes CN Search API 的 screenshotUrls（开发者提交的
 *   App Store 商店页截图 = 真实界面，非营销海报不可控，逐张人工筛）
 * - 产出：assets/realshots/<appId>-N.png + data/realshots.js 注册表
 * - 版权：截图版权归各开发商；产品内仅作教学参考并标注来源，
 *   商用发布前应替换为自有真机截图（诚实清单）
 * - 用法：node tools/fetch-realshots.js
 * ============================================================ */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'realshots');
fs.mkdirSync(OUT, { recursive: true });

/* 与 fetch-icons.js 同源白名单：term=搜索词；match=应用名前缀；id=APP id */
const LIST = [
  { term: '微信',       match: '微信',      id: 'wechat' },
  { term: '淘宝',       match: '淘宝',      id: 'taobao' },
  { term: '抖音',       match: '抖音',      id: 'douyin' },
  { term: '高德地图',   match: '高德地图',  id: 'amap' },
  { term: '铁路12306', match: '铁路12306', id: '12306' },
  { term: '支付宝',     match: '支付宝',    id: 'alipay' },
  { term: '美团',       match: '美团-',     id: 'meituan' },
  { term: '掌上12333', match: '掌上12333', id: 'social' },
  { term: '交管12123', match: '交管12123', id: 'traffic' },
];
const MAX_PER_APP = 6;

function curlJson(url) {
  return JSON.parse(execFileSync('curl', ['-s', '--max-time', '20', url], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
}

const registry = {};
let ok = 0, fail = 0;
for (const item of LIST) {
  try {
    const q = encodeURIComponent(item.term);
    const data = curlJson('https://itunes.apple.com/cn/search?term=' + q + '&entity=software&limit=8');
    const hit = (data.results || []).find(r => r.trackName === item.match)
             || (data.results || []).find(r => (r.trackName || '').startsWith(item.match));
    if (!hit) { console.error('  ✗ ' + item.id + ' 未命中: ' + item.term); fail++; continue; }
    const shots = (hit.screenshotUrls || []).slice(0, MAX_PER_APP);
    if (!shots.length) { console.error('  ✗ ' + item.id + ' 无商店截图'); fail++; continue; }
    let n = 0;
    shots.forEach((url, i) => {
      const dest = path.join(OUT, item.id + '-' + (i + 1) + '.png');
      try {
        execFileSync('curl', ['-s', '--max-time', '30', '-o', dest, url], { stdio: 'pipe' });
        if (fs.statSync(dest).size < 5000) throw new Error('too small');
        n++;
      } catch (e) { if (fs.existsSync(dest)) fs.unlinkSync(dest); }
    });
    if (n > 0) { registry[item.id] = n; ok++; console.log('  ✓ ' + item.id + ' (' + hit.trackName + ') ' + n + ' 张'); }
    else fail++;
  } catch (e) {
    console.error('  ✗ ' + item.id + ' 失败: ' + e.message.slice(0, 80));
    fail++;
  }
}

const regJs = '/* 由 tools/fetch-realshots.js 自动生成，勿手改。REAL_SHOTS[appId] = 商店真机截图张数（assets/realshots/<id>-N.png） */\n'
  + 'var REAL_SHOTS = ' + JSON.stringify(registry, null, 0) + ';\n'
  + 'if (typeof module !== \'undefined\' && module.exports) module.exports = { REAL_SHOTS: REAL_SHOTS };\n';
fs.writeFileSync(path.join(__dirname, '..', 'data', 'realshots.js'), regJs, 'utf8');
console.log('完成：' + ok + ' 个 App 配真机截图 / ' + fail + ' 失败 -> data/realshots.js');
