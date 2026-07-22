// 通用弹窗组件
// props: cfg { id, hero_image, brand_label, brand_label_color, top_title, subtitle_1, subtitle_2, brands, button_text, button_link, bg_color, button_color, text_color }
// events: close, buttonTap (e.detail = { link })

Component({
  options: {
    multipleSlots: false,
  },

  properties: {
    cfg: {
      type: Object,
      value: null,
    },
    visible: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onMaskTap() {
      this.triggerEvent("close");
    },
    onClose() {
      this.triggerEvent("close");
    },
    noop() {},
    onButtonTap() {
      const cfg = this.properties.cfg || {};
      this.triggerEvent("buttonTap", { link: cfg.button_link || "" });
    },
  },
});
