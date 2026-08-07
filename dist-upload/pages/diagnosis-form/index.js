Page({
  data: {
    /* ── 输入题 1-6 ── */
    inputQuestions: [
      { id: "full_name", label: "1. 你的名字", placeholder: "请输入", required: true },
      { id: "wechat_id", label: "2. 你的微信号", placeholder: "请输入微信号（用于联系）", required: true },
      { id: "age", label: "3. 年龄", placeholder: "请输入", required: true },
      { id: "video_course_info", label: "4. 是否视频课学员，你在几号社群，微信名？（优先连）", placeholder: "请输入", required: true },
      { id: "look_vs_age", label: "5. 看上去会比同年人（ ）？", placeholder: "请输入", required: true },
      { id: "height", label: "6. 身高：", placeholder: "请输入", required: true },
    ],
    /* ── 单选题 7-17 ── */
    choiceQuestions: [
      { id: "q7", label: "7. 你看起来的身高和实际身高相比会：", options: ["A. 显高", "B. 显矮", "C. 正常", "D. 不知道"], required: true },
      { id: "q8", label: "8. 有没有擅长体育项目：（跑步、打球、瑜伽、舞蹈等都算，比别人学起来厉害，甚至有拿奖）", options: ["A. 有", "B. 没有"], required: true },
      { id: "q9", label: "9. 你穿正装与休闲装哪个好看？", options: ["A. 正装有气质", "B. 休闲装好看", "C. 都差不多", "D. 不知道"], required: true },
      { id: "q10", label: "10. 穿裤装和裙装哪个好看？", options: ["A. 裤装", "B. 裙装", "C. 都差不多，没区别", "D. 不知道"], required: true },
      { id: "q11", label: "11. 你穿连衣裙和半裙哪个好看？", options: ["A. 连衣裙", "B. 半裙", "C. 都差不多", "D. 不知道"], required: true },
      { id: "q12", label: "12. 你穿上衣（不是风衣大衣）到哪个长度好看？", options: ["A. 短款", "B. 中款", "C. 长款", "D. 都差不多"], required: true },
      { id: "q13", label: "13. 有没有这样的现象：你穿的衣服的面料看上去价值感高就好看，价值感一般的就不好看？", options: ["A. 有", "B. 没有"], required: true },
      { id: "q14", label: "14. 你小时候会不会调皮淘气，上墙爬树的行为？", options: ["A. 有", "B. 没有"], required: true },
      { id: "q15", label: "15. 你在青春期身型发育上（前凸后翘）和同年人相比", options: ["A. 会早些", "B. 正常发育", "C. 较晚"], required: true },
      { id: "q16", label: "16. 洗完脸后当时皮肤会不会白一些，过一段时间又恢复。", options: ["A. 会", "B. 不会"], required: true },
      { id: "q17", label: "17. 平时会不会容易脸红（不包括大的运动、害羞、喝酒等）", options: ["A. 容易", "B. 不容易"], required: true },
    ],

    form: {},
    answers: {},
    photoNote: "",
    photoPaths: ["", "", ""],
    photoUrls: ["", "", ""],
    uploadingIndex: null,
    submitting: false,
    submitError: "",
    needLogin: false,
    submitted: false,
  },

  onLoad: function () {
    var info = wx.getStorageSync("user_info");
    var token = wx.getStorageSync("token");
    if (!token && (!info || !info.nickName)) {
      this.setData({ needLogin: true });
    }
  },

  goLogin: function () { wx.navigateTo({ url: "/pages/login/index" }); },
  goBack: function () { wx.navigateBack({ delta: 1 }); },

  onInput: function (e) {
    var qid = e.currentTarget.dataset.qid;
    var form = this.data.form;
    form[qid] = e.detail.value;
    this.setData({ form: form });
  },

  onChoice: function (e) {
    var qid = e.currentTarget.dataset.qid;
    var opt = e.currentTarget.dataset.opt;
    var answers = this.data.answers;
    answers[qid] = opt;
    this.setData({ answers: answers });
  },

  onPhotoNote: function (e) { this.setData({ photoNote: e.detail.value }); },

  choosePhoto: function (e) {
    var t = this;
    var idx = Number(e.currentTarget.dataset.idx);
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: function (res) {
        var paths = t.data.photoPaths.slice();
        paths[idx] = res.tempFilePaths[0];
        t.setData({ photoPaths: paths });
        t.uploadPhoto(idx, res.tempFilePaths[0]);
      },
    });
  },

  uploadPhoto: function (idx, filePath) {
    var t = this;
    t.setData({ uploadingIndex: idx });
    wx.uploadFile({
      url: "https://colour-choice.art/api/upload",
      filePath: filePath,
      name: "file",
      success: function (r) {
        t.setData({ uploadingIndex: null });
        try {
          var d = JSON.parse(r.data);
          if (d.url) {
            var urls = t.data.photoUrls.slice();
            urls[idx] = d.url;
            t.setData({ photoUrls: urls });
          } else {
            wx.showToast({ title: "上传失败", icon: "none" });
          }
        } catch (err) {
          wx.showToast({ title: "解析失败", icon: "none" });
        }
      },
      fail: function () {
        t.setData({ uploadingIndex: null });
        wx.showToast({ title: "上传失败", icon: "none" });
      },
    });
  },

  validate: function () {
    var d = this.data;
    for (var i = 0; i < d.inputQuestions.length; i++) {
      var q = d.inputQuestions[i];
      if (q.required && !d.form[q.id]) {
        return "请填写：" + q.label.replace(/^\d+\.\s*/, "");
      }
    }
    for (var j = 0; j < d.choiceQuestions.length; j++) {
      var c = d.choiceQuestions[j];
      if (c.required && !d.answers[c.id]) {
        return "请选择：" + c.label.replace(/^\d+\.\s*/, "");
      }
    }
    return "";
  },

  submit: function () {
    var t = this;
    if (t.data.submitting) return;

    var err = t.validate();
    if (err) { wx.showToast({ title: err, icon: "none" }); return; }

    var token = wx.getStorageSync("token");
    var info = wx.getStorageSync("user_info");
    if (!token && (!info || !info.nickName)) { t.setData({ needLogin: true }); return; }

    t.setData({ submitting: true, submitError: "" });
    wx.showLoading({ title: "正在提交..." });

    var openidPromise = getApp().getOpenid
      ? getApp().getOpenid()
      : Promise.resolve(wx.getStorageSync("wx_openid") || "");

    openidPromise.then(function (openid) {
      var d = t.data;
      var payload = {
        user_openid: openid || "",
        full_name: d.form.full_name || null,
        wechat_id: d.form.wechat_id || null,
        age: d.form.age || null,
        video_course_info: d.form.video_course_info || null,
        look_vs_age: d.form.look_vs_age || null,
        height: d.form.height || null,
        answers: d.answers,
        photo_note: d.photoNote || null,
        photo_urls_1: d.photoUrls[0] ? [d.photoUrls[0]] : [],
        photo_urls_2: d.photoUrls[1] ? [d.photoUrls[1]] : [],
        photo_urls_3: d.photoUrls[2] ? [d.photoUrls[2]] : [],
      };

      wx.request({
        url: "https://colour-choice.art/api/style-test/submit",
        method: "POST",
        data: payload,
        success: function (r) {
          wx.hideLoading();
          t.setData({ submitting: false });
          var res = r.data || {};
          if (res.error) {
            if (r.statusCode === 401) {
              t.setData({ needLogin: true });
              wx.showToast({ title: "请重新登录后再提交", icon: "none" });
            } else {
              t.setData({ submitError: res.error });
              wx.showModal({ title: "提交失败", content: res.error, showCancel: false });
            }
            return;
          }
          t.setData({ submitted: true });
          wx.showToast({ title: "提交成功", icon: "success", duration: 2000 });
        },
        fail: function () {
          wx.hideLoading();
          t.setData({ submitting: false, submitError: "网络异常，请重试" });
          wx.showToast({ title: "网络异常，请重试", icon: "none" });
        },
      });
    }).catch(function () {
      wx.hideLoading();
      t.setData({ submitting: false });
      wx.showToast({ title: "获取登录信息失败，请重试", icon: "none" });
    });
  },
});
