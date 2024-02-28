/**
 * Created by Andrewz on 2/26/19.
 */
var TQDebugger = TQDebugger || {};
TQDebugger.Panel = (function() {
  var panel,
    eleLog;
  return {
    init: init,
    open: open,
    close: close,
    logInfo: logInfo
    // addButton: addButton
  };

  function init() {
    if (panel) {
      return;
    }

    var htmlStr = "<button onclick=\"debugger_clear();\">清空</button>" +
      "<button onclick=\"debugger_close();\">关闭</button>" +
      "<div id=\"id-debug-info\"></div>";

    window.debugger_clear = function(method) {
      if (eleLog) {
        eleLog.innerHTML = "";
      }
    };
    window.debugger_close = function() {
      TQDebugger.Panel.close();
    };

    panel = TQ.DomUtility.createElement(document.body, "div", "id-debug-panel", "debug-panel-layer");
    panel.innerHTML = htmlStr;
    TQ.DomUtility.showElement(panel);
    panel.addEventListener("touchstart", onTouchStart, false);
    panel.addEventListener("touchmove", onTouchMove, false);
    var startX; var startY;
    var startTop = TQ.Utility.readLocalStorage("startTop", 200);
    var startLeft = TQ.Utility.readLocalStorage("startLeft", 0);

    panel.style.left = startLeft + "px";
    panel.style.top = startTop + "px";

    function onTouchStart(evt) {
      var touch = evt.touches[0];
      if (touch) {
        startX = touch.clientX;
        startY = touch.clientY;
        startTop = TQ.Utility.getCssSize(panel.style.top);
        startLeft = TQ.Utility.getCssSize(panel.style.left);
      }
    }

    function onTouchMove(evt) {
      var touch = evt.touches[0];
      if (touch) {
        var newLeft = startLeft + (touch.clientX - startX);
        var newTop = startTop + (touch.clientY - startY);
        panel.style.left = newLeft + "px";
        panel.style.top = newTop + "px";
        TQ.Utility.writeLocalStorage("startTop", newTop);
        TQ.Utility.writeLocalStorage("startLeft", newLeft);
      }
    }

    if (!eleLog) {
      eleLog = document.getElementById("id-debug-info");
    }

    // 要显示它？un comment下面的句子：
    close();
  }

  function open() {
    TQ.DomUtility.showElement(panel);
  }

  function close() {
    TQ.DomUtility.hideElement(panel);
  }

  function logInfo(msg) {
    var src = eleLog.innerHTML;
    while (src.length > 400) {
      var pos = src.indexOf("</p>", 20);
      src = src.substr(pos);
    }
    if (eleLog) {
      eleLog.innerHTML = src + "<p>" + msg + "</p>";
    }
  }
}());
