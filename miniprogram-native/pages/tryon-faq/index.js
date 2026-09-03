var guard = require('../../utils/agent-guard.js');
var mp = require('../../utils/mp-page-copy.js');

Page({
  data: {
    tryon: {}
  },

  onLoad: function () {
    if (!guard.guardAgentOnly()) return;
    var self = this;
    mp.loadMpSection('tryon', function (copy) { self.setData({ tryon: copy }); });
  },

  toggle: function (e) {
    var i = e.currentTarget.dataset.i;
    var key = 'tryon.faq.faqs[' + i + '].open';
    this.setData({ [key]: !this.data.tryon.faq.faqs[i].open });
  },
});
