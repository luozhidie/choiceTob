Page({
  data:{
    step:'intro',       // intro | quiz | passed | style | recommend | sales | rank | benefits | done
    quizIdx:0,
    selectedAnswer:null,
    showResult:false,
    isCorrect:false,
    wrongCount:0,

    // 风格相关
    styleInput:'',
    selectedStyles:[],
    styleActiveMap:{},     // 预计算：每个风格是否选中，避免wxml里用indexOf
    recStyles:[],          // 预计算：推荐风格列表（最多4个），避免wxml里用slice/三元数组

    // 销售额
    salesInput:'',
    // 排名估算
    rankPercent:0,

    submitting:false,
    submitError:'',
    needLogin:false,

    QUIZ:[
      {q:'炒货就是某些档口到一批市场拿的货，在其他一批市场拿同款',a:['A. 对','B. 错'],c:0},
      {q:'以下哪个属于"拿货"的术语？',a:['A.多少钱1件','B.怎么拿','C.衣服怎么卖'],c:1},
      {q:'以下哪个属于正确的服装批发市场？',a:['A.杭州四季青','B.广州四季青','C.深圳四季青'],c:0},
      {q:'10件起批是什么意思？',a:['A.10件以内按批发价','B.10件才能按批发价','C.100件才能按批发价'],c:1},
      {q:'同款是"打包价"便宜还是"拿货价"便宜？',a:['A.打包价','B.拿货价'],c:0},
      {q:'二批市场就是从一批拿货回各个城市销售的',a:['A. 对','B. 错'],c:0},
    ],

    STYLES:['淑女风','知性风','名媛风','中性风','潮牌风','职业风','休闲风','大牌风'],

    STYLE_MAP:{'淑女风':'少女型','知性风':'知性型','名媛风':'优雅型','中性风':'中性型',
              '潮牌风':'时尚型','职业风':'古典型','休闲风':'自然型','大牌风':'奢华型'},

    benefits:[
      {icon:'👁️',name:'批发价查看权',desc:'通过认证即可查看所有商品批发价'},
      {icon:'🎁',name:'退换额度权益',desc:'充值后享阶梯退换额度（最高20%）'},
      {icon:'✨',name:'新款抢先看',desc:'当季新品提前浏览与推荐'},
      {icon:'📈',name:'全国排名',desc:'了解自己在行业中的位置'},
    ],

    TIER_BENEFITS:[
      {amount:'5万',returnRate:'5%',color:'#3b82f6'},
      {amount:'10万',returnRate:'10%',color:'#f59e0b'},
      {amount:'30万',returnRate:'20%',color:'#a855f7'},
    ]
  },

  onLoad:function(){
    var t=this;
    var token=wx.getStorageSync('token');
    var info=wx.getStorageSync('user_info');
    if(!token && (!info || !info.nickName)){
      t.setData({needLogin:true});
    }
    // 初始化 styleActiveMap（避免 wxml 用 indexOf）
    var map={};
    for(var i=0;i<t.data.STYLES.length;i++){map[t.data.STYLES[i]]=false;}
    t.setData({styleActiveMap:map});
  },

  goLogin:function(){wx.navigateTo({url:'/pages/login/index'});},
  goHome:function(){wx.switchTab({url:'/pages/home/index'});},

  goBackStep:function(){
    var t=this,s=t.data.step;
    if(s==='quiz'){ if(t.data.quizIdx>0){t.setData({quizIdx:t.data.quizIdx-1,showResult:false,selectedAnswer:null});} else {t.setData({step:'intro'});} }
    else if(s==='passed'){t.setData({step:'quiz',quizIdx:t.QUIZ.length-1,showResult:false,selectedAnswer:null});}
    else if(s==='style'){t.setData({step:'passed'});}
    else if(s==='recommend'){t.setData({step:'style'});}
    else if(s==='sales'){t.setData({step:'recommend'});}
    else if(s==='rank'){t.setData({step:'sales'});}
    else if(s==='benefits'){t.setData({step:'rank'});}
  },

  goQuiz:function(){this.setData({step:'quiz'});},

  /* ── 答题 ── */
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

  /* ── 风格选择 ── */
  toggleStyle:function(e){
    var t=this;
    var v=e.currentTarget.dataset.val;
    var list=t.data.selectedStyles||[];
    var map=t.data.styleActiveMap||{};
    if(list.indexOf(v)>=0){list=list.filter(function(s){return s!==v});map[v]=false;}
    else{list.push(v);map[v]=true;}
    t.setData({selectedStyles:list,styleActiveMap:map});
  },

  onStyleInput:function(e){this.setData({styleInput:e.detail.value});},
  onSalesInput:function(e){this.setData({salesInput:e.detail.value});},

  goStyle:function(){this.setData({step:'style'});},
  goRecommend:function(){
    var t=this;
    var src=t.data.selectedStyles&&t.data.selectedStyles.length>0?t.data.selectedStyles:['淑女风','潮牌风','职业风','休闲风'];
    var rec=[];
    for(var i=0;i<src.length&&i<4;i++){rec.push(src[i]);}
    t.setData({recStyles:rec,step:'recommend'});
  },
  goSales:function(){this.setData({step:'sales'});},
  goRank:function(){
    var t=this;
    var sales=Number((t.data.salesInput||'').replace(/[^\d]/g,''))||0;
    t.setData({rankPercent:t.estimateRankPercent(sales),step:'rank'});
  },

  /* ── 提交认证（真实提交后端）── */
  submitCertify:function(){
    var t=this;
    if(t.data.submitting)return;
    t.setData({submitting:true,submitError:''});

    var token=wx.getStorageSync('token');
    if(!token){
      t.setData({submitting:false,needLogin:true});
      return;
    }

    var style=(t.data.selectedStyles.length>0?t.data.selectedStyles.join(','):(t.data.styleInput||''));
    var sales=Number((t.data.salesInput||'').replace(/[^\d]/g,''))||0;

    wx.request({
      url:'https://colour-choice.art/api/auth/certify',
      method:'POST',
      data:{token:token,quiz_passed:true,style:style||undefined,monthly_sales:sales>0?sales:undefined},
      success:function(r){
        t.setData({submitting:false});
        var d=r.data||{};
        if(d.error){
          if(r.statusCode===401){t.setData({needLogin:true});wx.showToast({title:'请重新登录后再认证',icon:'none'});}
          else{t.setData({submitError:d.error});wx.showModal({title:'认证失败',content:d.error,showCancel:false});}
          return;
        }
        // 成功：同步本地状态
        wx.setStorageSync('is_certified_store_owner',true);
        wx.setStorageSync('certified_style',style);
        wx.setStorageSync('certified_monthly_sales',sales);
        var app=getApp();
        if(app&&app.globalData)app.globalData.isCertifiedStoreOwner=true;

        // 先显示排名（基于输入的销售额）
        var pct=t.estimateRankPercent(sales);
        t.setData({rankPercent:pct});

        setTimeout(function(){t.setData({step:'benefits'});},300);
        wx.showToast({title:'认证成功！已开启批发价',icon:'success',duration:2000});
      },
      fail:function(){
        t.setData({submitting:false,submitError:'网络异常，请重试'});
        wx.showToast({title:'网络异常，请重试',icon:'none'});
      }
    });
  },

  goBenefits:function(){this.submitCertify();},

  /* ── 排名估算 ── */
  estimateRankPercent:function(sales){
    if(sales<=0)return 30;
    if(sales<5000)return 40;
    if(sales<30000)return 55;
    if(sales<80000)return 70;
    if(sales<200000)return 85;
    return 95;
  },

  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  goMy:function(){wx.switchTab({url:'/pages/my/index'});},
});
