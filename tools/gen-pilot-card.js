// 生成 A5 试点引导卡（单文件 HTML，内嵌 QR SVG，@page A5 打印即用）
// Usage: node tools/gen-pilot-card.js   （在 yinling-zhijian 目录下）
const fs = require('fs');
const path = require('path');

const qrSvg = fs.readFileSync(path.join(__dirname, '../../_交付/试点物料/qr-银龄指尖.svg'), 'utf8');
const url = 'https://kratoslee-6.github.io/yinling-zhijian/';

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>银龄指尖 · A5引导卡</title>
<style>
  @page { size: A5 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; background: #f0f0f0; }
  .card {
    width: 148mm; height: 210mm; margin: 8mm auto; background: #fff;
    display: flex; flex-direction: column; align-items: center;
    padding: 12mm 10mm; text-align: center;
    box-shadow: 0 2px 12px rgba(0,0,0,.15);
  }
  @media print { body { background: #fff; } .card { margin: 0; box-shadow: none; } }
  h1 { font-size: 34pt; color: #1A1A1A; letter-spacing: 4pt; }
  .sub { font-size: 13pt; color: #E53935; font-weight: bold; margin-top: 3mm; }
  .qr { width: 78mm; height: 78mm; margin: 8mm 0 4mm; }
  .qr svg { width: 100%; height: 100%; }
  .scan { font-size: 17pt; font-weight: bold; color: #1A1A1A; }
  .steps { margin-top: 9mm; width: 100%; }
  .step { display: flex; align-items: center; text-align: left; margin: 5mm 0; }
  .num {
    flex: 0 0 13mm; height: 13mm; border-radius: 50%; background: #E53935; color: #fff;
    font-size: 17pt; font-weight: bold; display: flex; align-items: center; justify-content: center;
    margin-right: 5mm;
  }
  .step p { font-size: 14.5pt; color: #1A1A1A; line-height: 1.45; }
  .foot { margin-top: auto; font-size: 10pt; color: #888; line-height: 1.6; }
</style>
</head>
<body>
<div class="card">
  <h1>银龄指尖</h1>
  <div class="sub">爸妈的手机图解教程 · 免费 · 无广告</div>
  <div class="qr">${qrSvg}</div>
  <div class="scan">微信「扫一扫」，对准上面的码</div>
  <div class="steps">
    <div class="step"><div class="num">1</div><p>打开<b>微信</b>，点右上角 ＋，选「扫一扫」</p></div>
    <div class="step"><div class="num">2</div><p>对准二维码，点开想要的<b>教程</b></p></div>
    <div class="step"><div class="num">3</div><p>跟着<b>红圈</b>提示，一步一步照着点</p></div>
  </div>
  <div class="foot">微信 · 支付宝 · 抖音 · 高德地图 · 12306 购票 等 10 个常用软件<br>61 篇一步一步的图解教程 · 字大 · 能朗读 · 不用注册</div>
</div>
</body>
</html>`;

const out = path.join(__dirname, '../../_交付/试点物料/引导卡-A5.html');
fs.writeFileSync(out, html);
console.log('card written:', out, `(${html.length} bytes, url=${url})`);
