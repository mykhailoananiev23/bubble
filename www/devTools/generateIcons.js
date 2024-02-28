/**
 * Created by Andrewz on 11/16/18.
 */

var TQ = TQ || {};
TQ.DevTools = TQ.DevTools || {};

TQ.DevTools = (function() {
  var FOR_WIDTH600 = true; // 分辨率W<600的手机， 否则是平板：600*960， 768*1024
  var lineBuffer = "";
  const smallIcons = {
    names: ["plus", "change", "share", "delete", "modify-element", "trash", "close", "ok"],
    prefix: "smc",
    WIDTH: 48,
    HEIGHT: 48,
    numRow: 1,
    lenRow: 8
  };
  const bigIcons = {
    names: [
      "change-skin", "mirror-x", "mirror-y", "animation", "bottom-in", "top-in",
      "right-in", "left-in", "scale-in", "fade-in", "rotate", "float-x",
      "twinkle", "change-bg", "ok2", "topic-list", "my-udoido", "",
      "", "", "", "", "undo", "redo",
      "unpin", "pin", "up-layer", "down-layer", "group", "ungroup",
      "camera", "album", "", "", "back-arrow", "home-page",
      "edit", "voice-record", "new", "clone", "replay", "mic",
      "try-sound", "sounds", "stop-sound", "left-arrow", "right-arrow", "plus-bg",
      "change-bg", "share-bg", "delete-bg", "modify-element-bg", "trash-bg", "close-bg",
      "ok-bg", "erase", "in-sag", "idle-sag"
    ],
    prefix: "bgc",
    WIDTH: 80,
    HEIGHT: 80,
    numRow: 10,
    lenRow: 6
  };
  const smallRectIcons = {
    names: ["play", "pause", "idle-sag"],
    prefix: "smr",
    WIDTH: 120,
    HEIGHT: 44,
    numRow: 1,
    lenRow: 3
  };
  const bigRectIcons = {
    prefix: "bgr",
    WIDTH: 224,
    HEIGHT: 94,
    numRow: 1,
    lenRow: 3
  };

  return {
    iconTool: iconTool
  };

  function iconTool() {
    var scale = 1;
    if (FOR_WIDTH600) {
      scale = 0.5;
    } else {
      scale = 1;
    }

    let y0 = 0;
    generateIcons(0, y0, smallIcons); y0 += (smallIcons.numRow + 1) * smallIcons.HEIGHT * scale;
    generateIcons(0, y0, bigIcons); y0 += (bigIcons.numRow) * bigIcons.HEIGHT * scale;
    // generateIcons(0, y0, smallRectIcons);

    useIcons(smallIcons);
    useIcons(bigIcons);
    // useIcons(smallRectIcons);
    console.log(lineBuffer);
  }

  function generateIcons(x0, y0, icons) {
    var xOffset,
      yOffset,
      scale,
      albumSizeStr,
      btnSizeStr,
      name,
      idStr,
      defStr,
      row,
      i;

    if (FOR_WIDTH600) {
      scale = 0.5;
      albumSizeStr = "/" + 480 * 0.5 + "px " + 1120 * 0.5 + "px ";
      btnSizeStr = "0 0/" + icons.WIDTH * 0.5 + "px " + icons.HEIGHT * 0.5 + "px ";
    } else {
      scale = 1;
      albumSizeStr = "";
      btnSizeStr = "";
    }

    for (row = 0; row < icons.numRow; row++) {
      yOffset = -(y0 + row * icons.HEIGHT * scale);
      if (yOffset !== 0) {
        yOffset += "px";
      }
      for (i = 0; i < icons.lenRow; i++) {
        xOffset = -(x0 + i * icons.WIDTH * scale);
        if (xOffset !== 0) {
          xOffset += "px";
        }
        name = icons.names[i + row * icons.lenRow];
        if (name) {
          idStr = "#id-icon-" + name + ",\n";
        } else {
          idStr = "";
        }
        idStr += "#id-icon-" + icons.prefix + "-";
        if (row > 0) {
          idStr += row;
        }
        idStr += i;
        defStr = idStr + " {\n" +
                  "  background: url(\"/img/album.png\") no-repeat " + xOffset + " " + yOffset + albumSizeStr +
                    ", url(\"/img/button-" + icons.prefix + ".png\") no-repeat " + btnSizeStr + ";" + " \n" +
                  "}";

        lineBuffer += defStr + "\n";
      }
    }
  }

  function useIcons(icons) {
    var idStr,
      defStr,
      row,
      i;

    for (row = 0; row < icons.numRow; row++) {
      for (i = 0; i < icons.lenRow; i++) {
        idStr = "id-icon-" + icons.prefix + "-";
        if (row > 0) {
          idStr += row;
        }
        idStr += i;
        defStr = "<button id=\"" + idStr + "\"  class=\"button2-" + icons.prefix + "\"></button>";
        lineBuffer += defStr + "\n";
      }
    }
  }
}());
