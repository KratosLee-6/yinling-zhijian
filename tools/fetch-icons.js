#!/usr/bin/env node
/* ============================================================
 * 银龄指尖 · 官方 APP 图标抓取（一次性工具，可重复执行）
 * 数据源：Apple iTunes Search API（cn 区，官方上架应用原图 512px）
 * 安全口径：仅访问下方【固定白名单】的搜索词与返回的 mzstatic 官方 CDN，
 *          不接受任何用户输入的 URL——无 SSRF 面。
 * 用法：node tools/fetch-icons.js
 * ============================================================ */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const iconDir = path.join(__dirname, '..', 'assets', 'icons');

/* 固定白名单：term=搜索词；match=精确应用名或前缀；file=落盘文件名
 * 手机品牌取各自「官方商城/官方应用」的图标——即品牌 logo 本身 */
const LIST = [
  { term:'微信',        match:'微信',     file:'app-wechat.png' },
  { term:'淘宝',        match:'淘宝',     file:'app-taobao.png' },
  { term:'抖音',        match:'抖音',     file:'app-douyin.png' },
  { term:'高德地图',   match:'高德地图',  file:'app-amap.png' },
  { term:'铁路12306', match:'铁路12306', file:'app-12306.png' },
  { term:'支付宝',      match:'支付宝',   file:'app-alipay.png' },
  { term:'美团',        match:'美团-',    file:'app-meituan.png' },
  { term:'掌上12333',  match:'掌上12333', file:'app-12333.png' },
  { term:'交管12123',  match:'交管12123', file:'app-12123.png' },
  /* 手机品牌（品牌页） */
  { term:'华为商城',   match:'华为商城',  file:'brand-huawei.png' },
  { term:'小米商城',   match:'小米商城',  file:'brand-xiaomi.png' },
  { term:'OPPO商城',  match:'OPPO 商城', file:'brand-oppo.png' },
  { term:'vivo官方商城', match:'vivo 商城', file:'brand-vivo.png' },
  { term:'Apple Store', match:'Apple Store', file:'brand-apple.png' },
  { term:'三星商城',   match:'三星商城',  file:'brand-samsung.png' },
];

function curlJson(url) {
  const out = execFileSync('curl', ['-s', '--max-time', '20', url], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(out);
}
function curlDownload(url, dest) {
  execFileSync('curl', ['-s', '--max-time', '30', '-o', dest, url], { stdio: 'pipe' });
}

let ok = 0, fail = 0;
for (const item of LIST) {
  try {
    const q = encodeURIComponent(item.term);
    const data = curlJson('https://itunes.apple.com/cn/search?term=' + q + '&entity=software&limit=8');
    const hit = (data.results || []).find(r => r.trackName === item.match)
             || (data.results || []).find(r => (r.trackName || '').startsWith(item.match));
    if (!hit) throw new Error('未命中: ' + (data.results || []).map(r => r.trackName).join(' / '));
    const url = hit.artworkUrl512 || hit.artworkUrl100;
    if (!url || !/mzstatic\.com/.test(url)) throw new Error('非官方 CDN 图，拒绝: ' + url);
    const dest = path.join(iconDir, item.file);
    curlDownload(url, dest);
    const size = fs.statSync(dest).size;
    if (size < 2000) throw new Error('下载文件异常(' + size + 'B)');
    console.log('\u2713 ' + item.file + '  <- ' + hit.trackName + ' (' + hit.artistName + ') ' + Math.round(size / 1024) + 'KB');
    ok++;
  } catch (e) {
    console.log('\u2717 ' + item.file + '  ' + e.message);
    fail++;
  }
}
console.log('\n完成：' + ok + ' 成功 / ' + fail + ' 失败');
process.exit(fail === 0 ? 0 : 1);
