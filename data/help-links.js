/* 官方使用手册/帮助中心链接（2026-10-13 逐个探测公开可访问；仅收录官方域名）
 * apps: 键 = TUTORIALS 组键；brands: 键 = BRANDS id */
var HELP_LINKS = {
  apps: {
    wechat:  { url: 'https://kf.qq.com/',                               name: '腾讯客服（微信官方帮助）' },
    taobao:  { url: 'https://service.taobao.com/support/main/help_center.htm', name: '淘宝网帮助中心' },
    douyin:  { url: 'https://www.douyin.com/',                          name: '抖音官方网站' },
    amap:    { url: 'https://www.amap.com/',                            name: '高德地图官方网站' },
    '12306': { url: 'https://www.12306.cn/index/',                      name: '铁路12306官方网站（乘车指南）' },
    alipay:  { url: 'https://cshall.alipay.com/',                       name: '支付宝服务大厅（官方帮助）' },
    meituan: { url: 'https://www.meituan.com/',                         name: '美团官方网站' },
    social:  { url: 'https://www.12333.gov.cn/',                        name: '人社部12333官方网站' },
    traffic: { url: 'https://gab.122.gov.cn/',                          name: '交通安全综合服务管理平台（12123官方）' },
  },
  brands: {
    huawei:  { url: 'https://consumer.huawei.com/cn/support/',          name: '华为官方支持（含产品手册）' },
    xiaomi:  { url: 'https://www.mi.com/support',                       name: '小米官方服务与支持' },
    oppo:    { url: 'https://support.oppo.com/cn/',                     name: 'OPPO 官方服务支持' },
    vivo:    { url: 'https://www.vivo.com.cn/service.html',             name: 'vivo 官方服务（含说明书）' },
    apple:   { url: 'https://support.apple.com/zh-cn/guides/iphone',    name: 'Apple 官方 iPhone 使用手册' },
    samsung: { url: 'https://www.samsung.com.cn/support/',              name: '三星官方支持与服务' },
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = { HELP_LINKS: HELP_LINKS };
