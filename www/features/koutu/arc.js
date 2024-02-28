/**
 * Created by Andrewz on 10/7/2016.
 */

var KT = KT || {};

(function () {
  var arcs = [],
    arcsTBD = [];

  function Arc(id, regionId1, regionId2) {
    this.id = id;
    this.regionId1 = regionId1;
    this.regionId2 = regionId2;
    this.points = [];
    this.weight = 0;
  }

  Arc.getAllArcs = function () {
    return arcs;
  };

  Arc.getArcsTBD = function () {
    return arcsTBD;
  };

  Arc.init = function() {
    arcs.splice(0);
    arcsTBD.splice(0);
  };

  Arc.create = function (region1, region2) {
    var arc = new Arc(arcs.length + 1, region1, region2);
    arcs.push(arc);
    return arc;
  };

  Arc.refineBoundary = function() {
    arcs.forEach(function(item) {
      item.refineBoundary();
    })
  };

  Arc.removeArc = function (sRegionId, tRegionId) {
    var isInner = false;

    // arcsTBD的要求：
    // * sRegion 必须唯一， target不唯一,
    // * 出现在sRegionId之后， 就不能再出现在target中
    sRegionId = findNewSource(sRegionId);
    tRegionId = findNewTarget(tRegionId);

    arcsTBD.forEach(function (item) {
      if (item.tRegionId === sRegionId) {
        item.tRegionId = tRegionId;
      }

      if (item.sRegionId === tRegionId) {
        console.error(item.id, "remove", sRegionId, tRegionId);
      }
    });

    if (sRegionId === tRegionId) {
      // console.error("same region", sRegionId, tRegionId);
      isInner = true;
    } else {
      arcsTBD.push({sRegionId: sRegionId, tRegionId: tRegionId});
    }
    return isInner;
  };

  function findNewSource(sRegionId) {
    var n = arcsTBD.length;

    for (var j = 0; j < n; j++) {
      for (var i = 0; i < n; i++) {
        if (arcsTBD[i].sRegionId === sRegionId) {
          sRegionId = arcsTBD[i].tRegionId;
        }
      }
    }

    for (i = 0; i < n; i++) {
      if (arcsTBD[i].sRegionId === sRegionId) {
        console.error("error", arcsTBD[i].sRegionId, arcsTBD[i].tRegionId);
        break;
      }
    }

    return sRegionId;
  }

  function findNewTarget(tRegionId) {
    var n = arcsTBD.length;

    for (var j = 0; j < n; j++) {
      for (var i = 0; i < n; i++) {
        if (arcsTBD[i].sRegionId === tRegionId) {
          tRegionId = arcsTBD[i].tRegionId;
          break;
        }
      }
    }

    for (i = 0; i < n; i++) {
      if (arcsTBD[i].sRegionId === tRegionId) {
        console.error("error the target has already been merged!! ", arcsTBD[i].sRegionId, arcsTBD[i].tRegionId);
        break;
      }
    }

    return tRegionId;
  }

  var p = Arc.prototype;
  p.add = function (ptIndex) {
    this.points.push(ptIndex);
  };

  p.toString = function () {
    var i,
      msg = this.id + "(w=" + this.weight.toFixed(3) + ", h=" + this.height.toFixed(3) + ")" + this.regionId1 + "-" + this.regionId2;

    for (i = 0; i < Math.min(3, this.points.length); i++) {
      msg += "  " + this.points[i];
    }

    return msg;
  };

  p.getPoints = function () {
    return this.points;
  };

  p.setRegionId = function (regionId) {
    this.points.forEach(function (ptIndex) {
      KT.Picture.setRegionId(ptIndex, regionId);
    });
  };

  p.calWeight = function () {
    var n = this.points.length,
      ptIndex,
      average = 0,
      getGpbByIndex = KT.Picture.getGpbByIndex;

    for (var i = 0; i < n; i++) {
      ptIndex = this.points[i];
      average += getGpbByIndex(ptIndex) / n;
    }
    this.weight = average / 255.0;
  };

  p.clear = function () {
    this.points.splice(0);
  };

  p.isInner = function () {
    return (this.regionId1 === this.regionId2);
  };

  p.mergeTo = function (targetArc) {
    if (this.id === targetArc.id) {
      // console.error("same arc, skip");
      return;
    }
    this.points.forEach(function (ptIndex) {
      targetArc.add(ptIndex);
    });
    this.points.splice(0);
  };

  p.refineBoundary = function() {
    // 统一边界点的编号，总是让此点归入小号Region
    var unifiedId = (this.regionId1 < this.regionId2) ? this.regionId1 : this.regionId2;
    this.setRegionId(unifiedId);
  };

  p.toInners = function (regionId) {
    var targetRegion = KT.Region.getRegion(regionId);
    this.points.forEach(function (ptIndex) {
      targetRegion.addInnerPoint(ptIndex);
      KT.Picture.setRegionId(ptIndex, regionId);
    });
    this.points.splice(0);
  };

  p.updateRegionId = function (sId, tId) {
    if (this.regionId1 === sId) {
      this.regionId1 = tId;
    }
    if (this.regionId2 === sId) {
      this.regionId2 = tId;
    }

    if (this.isInner()) {
      this.toInners(this.regionId1);
    }
  };

  KT.Arc = Arc;
})();
