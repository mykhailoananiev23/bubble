/**
 * Created by Andrewz on 12/25/17.
 */
var TQ = TQ || {};
TQ.Utility = TQ.Utility || {}; // 扩充core中的函数
TQ.Utility.removeWelcomeTextPage = function() {
  function removeDomEleById(domId) {
    var domEle = document.getElementById(domId);
    if (domEle) {
      angular.element(domEle).remove();
    }
  }
  removeDomEleById("welcome-div");
  removeDomEleById("id-play-panel");
  removeDomEleById("welcome-brand");
};

TQ.Utility.parseQueryString = function() {
  var queryParams;

  TQ.QueryParams = TQ.Utility.parseUrl();
  queryParams = TQ.QueryParams.params;
  TQUtility.extendWithoutObject(TQ.QueryParams, {
    hideFirstClickPrompt: !!queryParams.hfcp,
    disableAudioUnlock: !!queryParams.dau,
    hideMenu: !!queryParams.hm,
    wxNickName: queryParams.wnn || "",
    wxCode: queryParams.wxc || "",
    noLocale: !!queryParams.nl,
    openAsTopic: queryParams.ot || "",
    topicId: queryParams.tid || 0,
    topicTitle: queryParams.tt || ""
  });

  // 兼容旧版小程序, 待升级完成之后，再删除此段代码
  // ---begin
  if ((typeof queryParams.wxc === "undefined") && (typeof queryParams.wbt !== "undefined")) {
    TQ.QueryParams.wxCode = queryParams.wbt;
  }
  // --- end
};
