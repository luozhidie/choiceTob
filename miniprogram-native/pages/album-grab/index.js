Page({
  data: {
    link: ""
  },
  onLink: function (e) {
    this.setData({ link: e.detail.value });
  },
  pasteLink: function () {
    var t = this;
    wx.getClipboardData({
      success: function (r) {
        if (r.data) {
          t.setData({ link: r.data });
          wx.showToast({ title: "已粘贴", icon: "none" });
        }
      }
    });
  },
  copyLink: function () {
    if (!this.data.link) {
      wx.showToast({ title: "请先粘贴链接", icon: "none" });
      return;
    }
    wx.setClipboardData({
      data: this.data.link,
      success: function () {
        wx.showToast({ title: "链接已复制", icon: "none" });
      }
    });
  },
  copyTool: function () {
    wx.setClipboardData({
      data: "https://colour-choice.art/admin/image-grabber",
      success: function () {
        wx.showToast({ title: "地址已复制，去浏览器打开", icon: "none" });
      }
    });
  }
});
