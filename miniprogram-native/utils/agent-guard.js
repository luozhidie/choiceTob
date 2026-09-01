// 虚拟试衣（AI 深度合成）功能：仅代理 / 管理员可见
// 目的：不面向公众提供 AI 生成服务，规避小程序「深度合成-AI创作」类目审核要求。
// 用法：在页面 onLoad 首行调用  if (!guard.guardAgentOnly()) return;

var ADMIN_KEY = 'is_admin';
var AGENT_KEY = 'is_agent';

function isAllowed() {
  try {
    return !!(wx.getStorageSync(ADMIN_KEY) || wx.getStorageSync(AGENT_KEY));
  } catch (e) {
    return false;
  }
}

function guardAgentOnly() {
  if (isAllowed()) return true;
  wx.showToast({
    title: '该功能仅对合作代理开放',
    icon: 'none',
    duration: 2000,
  });
  setTimeout(function () {
    try {
      var pages = getCurrentPages();
      if (pages && pages.length > 1) {
        wx.navigateBack({ delta: 1 });
      } else {
        wx.switchTab({ url: '/pages/home/index' });
      }
    } catch (e) {
      wx.switchTab({ url: '/pages/home/index' });
    }
  }, 1200);
  return false;
}

module.exports = {
  guardAgentOnly: guardAgentOnly,
  isAllowed: isAllowed,
};
