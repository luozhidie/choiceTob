Page({
  data:{
    step:0,
    answer:[],
    questions:[
      {q:'你平时最常穿什么？',options:['简约黑白灰','亮色系/印花','中性风（衬衫/西装）','甜美可爱风']},
      {q:'出门前你会花多少时间搭配？',options:['5分钟随便穿','10-20分钟认真搭配','30分钟以上精心准备','看心情，有时很用心']},
      {q:'你更看重穿搭的哪个方面？',options:['舒适实用','时尚潮流','个性表达','得体大方']}
    ],
    result:{name:'',desc:'',tips:[]},
  },

  pickOpt:function(e){
    var idx=e.currentTarget.dataset.idx;
    var ans=this.data.answer;
    ans[this.data.step]=idx;
    this.setData({answer:ans});
  },

  prevStep:function(){
    if(this.data.step>0)this.setData({step:this.data.step-1});
  },

  nextStep:function(){
    var s=this.data.step;
    var a=this.data.answer;
    if(a[s]===undefined)return;
    if(s<this.data.questions.length-1){this.setData({step:s+1});}
    else{this.calcResult();}
  },

  calcResult:function(){
    var a=this.data.answer;
    var scores={A:0,B:0,C:0,D:0};
    var map=['A','B','C','D'];
    for(var i=0;i<a.length;i++){
      if(a[i]!==undefined)scores[map[a[i]]]++;
    }
    var max='A';var ms=scores.A;
    if(scores.B>ms){max='B';ms=scores.B;}
    if(scores.C>ms){max='C';ms=scores.C;}
    if(scores.D>ms){max='D';}

    var results={
      A:{name:'极简主义风格',desc:'你追求简洁、干净的线条和色彩，注重品质而非数量。适合基础款单品+经典配色。',tips:['黑白灰驼色系','质感面料优先','少而精的衣橱策略']},
      B:{name:'时尚先锋风格',desc:'你敢于尝试新鲜事物，喜欢用色彩和图案表达自我。走在潮流前沿是你的标签。',tips:['大胆撞色/印花','配饰是点睛之笔','关注每季趋势']},
      C:{name:'知性优雅风格',desc:'你偏爱有质感的剪裁和中性色调，职场与生活都能轻松切换的专业形象。',tips:['西装/衬衫/阔腿裤','大地色+莫兰迪色','注重版型合身']},
      D:{name:'甜美温柔风格',desc:'你喜欢柔和的色彩和浪漫的设计元素，给人温暖亲切的第一印象。',tips:['粉色/米白/淡蓝','荷叶边/蝴蝶结','柔软针织+蕾丝']}
    };
    this.setData({result:results[max]});
  },

  goBuyer:function(){wx.switchTab({url:'/pages/buyer/index'});},
  reTest:function(){this.setData({step:0,answer:[],result:{name:'',desc:'',tips:[]}});},
});
