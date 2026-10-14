#!/usr/bin/env node
/* ============================================================
 * 银龄指尖 · M1 真机拍摄脚本生成器
 * - 依据麦龄团队公开的适老教程生产规范（爱范儿 2022-04 采访）+
 *   本项目数据层 61 条教程 / 244 步，生成《M1-真机拍摄脚本.md》
 * - 每一步 = 「动作前」的那一屏截图 + 拍摄要点（红圈位置/打码提醒）
 * - 用法：node tools/gen-shotlist.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const D = require(path.join(__dirname, '..', 'data', 'tutorials.js'));
const DEST = path.join(__dirname, '..', '..', '_交付', 'M1-真机拍摄脚本.md');

const APP_ORDER = ['wechat', 'alipay', '12306', 'douyin', 'amap', 'taobao', 'meituan', 'social', 'traffic'];
const APP_NAME = {};
Object.keys(D.TUTORIALS).forEach(g => { APP_NAME[g] = D.TUTORIALS[g].name; });
const BRAND_NAME = { huawei: '华为', xiaomi: '小米', oppo: 'OPPO', vivo: 'vivo', apple: '苹果', samsung: '三星' };

/* 每步截图的拍摄要点：动作 → 「拍动作发生前的界面」+ 圈注提示 */
function shotTip(step) {
  const d = step.d;
  if (/^打开/.test(d)) return '手机桌面/首页（能看到 App 图标）；红圈圈住 App 图标';
  const btn = [...d.matchAll(/【([^】]+)】/g)].map(m => m[1]);
  if (btn.length) return '动作前界面；红圈圈住「' + btn[0] + '」按钮原样，不打码不变形';
  if (/输入|填写|^填/.test(d)) return '输入框空白/待输入状态；圈住输入框';
  if (/等待|收到|成功|就是|完成/.test(d)) return '结果状态那一屏（成功提示/短信/通话界面）';
  return '该动作发生前的完整界面';
}

let md = [];
md.push('# 银龄指尖 · M1 真机拍摄脚本');
md.push('');
md.push('> 生成：`node tools/gen-shotlist.js`（2026-10-13，依据 data/tutorials.js 61 条教程 / 244 步自动生成）');
md.push('> 设备：KX 两部真机（安卓 + iPhone 各一，微信双端界面有差异，重点步骤各拍一套）');
md.push('');
md.push('## 一、拍摄规范（源自麦龄团队公开方法论 + 本项目实践）');
md.push('');
md.push('| # | 规范 | 说明 |');
md.push('|---|---|---|');
md.push('| 1 | 一屏一步 | 每张截图只回答「现在点哪里」，禁止一图多步 |');
md.push('| 2 | 步骤粒度到「傻」 | 「同意协议」和「点下一步」是两步，不合并 |');
md.push('| 3 | 界面干净 | 截图前清通知栏/关弹窗；聊天示例用自家小号，**人名头像昵称全打码或用假账号** |');
md.push('| 4 | 原样圈注 | 红圈圈住目标按钮即可，**不要 PS 按钮本身**（老人要在真机上找原样的字） |');
md.push('| 5 | 每步一句话 | 步骤文案 ≤15 字（门禁强制），复杂的话放「小提醒」 |');
md.push('| 6 | 重复容忍 | 同一操作老人要点 5–10 遍才记住，教程不做「进阶压缩」 |');
md.push('| 7 | 双端差异 | 微信安卓/iOS 布局有差异的步骤（付款/设置），两端各拍 |');
md.push('');
md.push('## 二、优先级（麦龄调研结论：老人最想学全民 App + 刚需技能）');
md.push('');
md.push('| 优先级 | App | 理由 |');
md.push('|---|---|---|');
md.push('| P0 | 微信 18 条 | 全民刚需，使用频率最高 |');
md.push('| P1 | 支付宝 / 铁路12306 | 付款、买票两大刚需 |');
md.push('| P2 | 抖音 / 高德 / 美团 | 高频生活 |');
md.push('| P3 | 掌上12333 / 交管12123 / 6 品牌设置 | 刚需但低频 |');
md.push('');
md.push('## 三、逐条拍摄清单（共 ' + Object.keys(D.TUTORIALS).length + ' 组 / 61 条 / 244 步）');
md.push('');

APP_ORDER.forEach(g => {
  const grp = D.TUTORIALS[g];
  md.push('### ' + grp.name + '（' + grp.tuts.length + ' 条）');
  md.push('');
  grp.tuts.forEach(t => {
    md.push('#### ' + t.id + ' · ' + t.name + (t.ver ? '（' + t.ver + '）' : ''));
    t.steps.forEach((s, i) => {
      md.push((i + 1) + '. **[' + s.d + ']** 拍：' + shotTip(s) + (s.hint ? '；〔提醒〕' + s.hint : ''));
    });
    md.push('');
  });
});

Object.keys(D.BRAND_TUTS).forEach(b => {
  md.push('### ' + BRAND_NAME[b] + ' 设置（4 条，同模板可复拍）');
  D.BRAND_TUTS[b].forEach(t => {
    md.push('#### ' + t.id + ' · ' + t.name);
    t.steps.forEach((s, i) => {
      md.push((i + 1) + '. **[' + s.d + ']** 拍：' + shotTip(s));
    });
    md.push('');
  });
});

fs.writeFileSync(DEST, md.join('\n'), 'utf8');
console.log('拍摄脚本已生成 -> ' + DEST);
console.log('总行数 ' + md.length);
