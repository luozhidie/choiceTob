Page({
  data:{
    step:'intro',       // intro | quiz | passed | style | sales | done
    quizIdx:0,
    selectedAnswer:null,
    showResult:false,
    isCorrect:false,
    wrongCount:0,
    styleInput:'',
    selectedStyles:[],
    salesInput:'',
    submitting:false,
  },

  QUIZ:[
    {q:'炒货就是某些档口到一批市场拿的货，在其他一批市场卖同款',a:['A. 对','B. 错'],c:0},
    {q:'以下哪个属于"拿货"的术语？',a:['A.多少钱1件','B.怎么拿','C.衣服怎么卖'],c:1},
    {q:'以下哪个属于正确的服装批发市场？',a:['A.杭州四季青','B.广州四季青','C.深圳四季青'],c:0},
    {q:'10件起批是什么意思？',a:['A.10件以内按批发价','B.10件才能按批发价','C.100件才能按批发价'],c:1},
    {q:'同款是"打包价"便宜还是"拿货价"便宜？',a:['A.打包价','B.拿货价'],c:0},
    {q:'二批市场就是从一批拿货回各个城市销售的',a:['A. 对','B. 错'],c:0},
  ],

  STYLES:['淑女风','知性风','名媛风','中性风','潮牌风','职业风','休闲风','大牌风'],

  benefits:[
    {icon:'👁️',name:'批发价查看权',desc:'通过认证即可查看所有商品批发价'},
    {icon:'🎁',name:'退换额度权益',desc:'充值后享阶梯退换额度（最高20%）'},
    {icon:'✨',name:'新款抢先看',desc:'当季新品提前浏览与推荐'},
    {icon:'📈',name:'全国排名',desc:'了解自己在行业中的位置'},
  ],

  onLoad:function(){},

  goQuiz:function(){this.setData({step:'quiz'});},

  // ── 答题 ──
  pickAnswer:function(e){var i=e.currentTarget.dataset.idx;if(this.data.showResult)return;this.setData({selectedAnswer:i});},

  confirmAnswer:function(){
    var t=this,d=t.data;
    if(d.selectedAnswer===null)return;
    var q=t.QUIZ[d.quizIdx];
    var ok=d.selectedAnswer===q.c;
    t.setData({isCorrect:ok,showResult:true});
    if(!ok)t.setData({wrongCount:d.wrongCount+1});
  },

  nextQuestion:function(){
    var t=this;
    if(t.data.quizIdx < t.QUIZ.length - 1){
      t.setData({quizIdx:t.data.quizIdx+1,showResult:false,selectedAnswer:null});
    }else{
      t.setData({step:'passed'});
    }
  },

  // ── 风格选择 ──
  toggleStyle:function(e){
    var v=e.currentTarget.dataset.val;
    var list=this.data.selectedStyles||[];
    if(list.indexOf(v)>=0){
      list=list.filter(function(s){return s!==v});
    }else{
      list.push(v);
    }
    this.setData({selectedStyles:list});
  },

  // ── 提交认证 ──
  submitCertify:function(){
    var t=this;
    t.setData({submitting:true});
    // 小程序无后端，存本地
    wx.setStorageSync('is_certified_store_owner',true);
    wx.setStorageSync('certified_style',
      (t.data.selectedStyles.length>0?t.data.selectedStyles.join(','):(t.data.styleInput||''))
    );
    wx.setStorageSync('certified_monthly_sales',
      Number(t.data.salesInput.replace(/[^\d]/g,''))||0
    );
    // 更新全局状态（使 buyer 页批发价立即可见）
    var app=getApp();
    if(app&&app.globalData)app.globalData.isPriceMember=true;

    setTimeout(function(){
      t.setData({step:'done',submitting:false});
      wx.showToast({title:'认证成功！已开启批发价',icon:'success',duration:2000});
    },500);
  },

  goStyle:function(){this.setData({step:'style'});},
  goSales:function(){this.setData({step:'sales'});},
  goBuyer:function(){wx.switchTab({url:'/pages/home/index'})||wx.redirectTo({url:'/pages/buyer/index'});},
  goHome:function(){wx.switchTab({url:'/pages/home/index'})},

  onStyleInput:function(e){this.setData({styleInput:e.detail.value});},
  onSalesInput:function(e){this.setData({salesInput:e.detail.value});},
});
