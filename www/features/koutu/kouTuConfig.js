/**
 * Created by Andrewz on 10/15/2016.
 */
var KT = KT || {};
KT.Config = {
  rescaleOnly: false, // true, // 只缩放素材， 不抠图
  diableWindowResize: true, // 避免自动测试中，下载数据的显示信息改变窗口代理变化
  isRegionViewer: false, //true, //
  isSingleRegion: false, //true, //
  //    noiseLevel: 0.01,      UCMHeight: 0.8,  // foot1
  //    noiseLevel: 0.02,      UCMHeight: 0.4,  // apple-grey
  noiseLevel: 0.0002, UCMHeight: 0.1, // blur-bkg
  gpbThreshold: 0.0005, // ������Ϊǰ���뱳���߽����Сgpbֵ��(�Լ���ؼ���region��������2K����300)
  bkgThreshodMin: 0.0001,
  pOfBkgMin: 0.3,    // 不是背景， 必须 < min
  pOfBkgMax: 0.9,   //  一定是背景,  （不论是在边界，还是内部）
  pOfBkgMaxB: 0.8,   // 可能是背景,  如果在边界上的话
  poiMin: 0.3,
  poiMax: 0.9,
  hasGaussian:  true, //false, //
  leftUpX0: 0.08,  //  +y���ϵ�����ϵ
  leftUpY0: 0.92,
  rightUpX0: 0.92,
  rightUpY0: 0.92,
  seedX0: 30,  //30
  seedY0: 387  //30
};

KT.State = {
};

KT.State.default = {
  connectivityOn: false,
  debugModeOn: false
};

KT.State.init = function () {
  for (prop in KT.State.default) {
    if (KT.State.default.hasOwnProperty(prop)) {
      KT.State[prop] = KT.State.default[prop];
    }
  }
};
