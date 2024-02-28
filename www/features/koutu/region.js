/**
 * Created by Andrewz on 10/4/2016.
 */
/*
  �ڲ��㣺 0x01,2,4,8
  �߽�㣺 0x11,12, 14, 18
  δȷ���� 0x41,42, 43, 48
*/
var KT = KT || {};

(function() {
  function Region(id) {
    this.inners = [];
    this.neighbors = [];
    this.seeds = [];
    this.regionId = id;
  }

  Region.MAX_REGION = 256 * 256 * 256; // 24λ
  Region.TYPE_UNKONWN_REGION = 0;
  var PT_TYPE_SAME_REGION = 1, // point
    PT_TYPE_OUT_OF_BOUNDARY = 1,
    PT_TYPE_BOUNDARY = 0x09,
    PT_TYPE_UNKNOWN = 0x81,
    RG_TYPE_INVALID = -1; //region

  var isSharedEdge = true; // false

  var p = Region.prototype;
  var neighboreId = Region.TYPE_UNKONWN_REGION,
    regions = [];

  function growConnect(seeds, candidates, counts) {
    for (var i = 0; i< seeds.length; i++) {
      var r1 = getRegion(seeds[i]);
      var arc;
      for (var nName in r1.neighbors) {
        if (!r1.neighbors.hasOwnProperty(nName)) {
          continue;
        }

        var neighborId = parseInt(nName);
        arc = r1.neighbors[neighborId];

        if (!arc) {
          console.error("arc is deleted: ", neighborId);
          continue;
        }

        if ((pos = candidates.indexOf(neighborId)) > 0) {
          candidates.splice(pos, 1);
          var neighbor = getRegion(neighborId);
          if (neighbor.isValidBkg(counts[neighborId])) {
            seeds.push(neighborId);
          }
        }
      }
    }

    TQ.Log.info(candidates.length+ " regions left!" + JSON.stringify(candidates));
    return seeds;
  }


  function create() {
    if (regions.length > Region.MAX_REGION) {
      console.error("too many noise!");
    }
    return new Region(regions.length + 1); //  region id ��1��ʼ
  }

  function getRegion(id) {
    if (id > regions.length) {
      TQ.Log.error("find region id out of boundary: id = " + id);
      return;
    }
    return regions[id - 1]; // ������region id�� from 1�� not 0
  }

  function init() {
    regions.splice(0);
  }

  function findGoodNeighbor(arc, excludeId) {
    var points = arc.getPoints(),
      candidates = [];

    points.forEach(function(ptIndex) {
      var x0 = KT.Picture.getX(ptIndex),
        y0 = KT.Picture.getY(ptIndex),
        x = x0,
        y = y0;

      var offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
      ];

      for (var i=0; i<4; i++) {
        x = x0 + offsets[i][0];
        y = y0 + offsets[i][1];
        for (;; x = x + offsets[i][0], y = y + offsets[i][1]) {
          var id = KT.Picture.getRegionIdByXY(x, y);
          if ((id === RG_TYPE_INVALID) || (id === Region.TYPE_UNKONWN_REGION)) {
            break;
          }
          if (id != excludeId) {
            break;
          }
        }

        if ((id === RG_TYPE_INVALID) || (id === Region.TYPE_UNKONWN_REGION)) {
          continue;
        }

        if (!candidates.hasOwnProperty(id)) {
          candidates[id] = {regionId: id, count: 1};
        } else {
          candidates[id].count += 1;
        }
      }
    });

    function sortNumber(a, b) {return a.count - b.count;}
    candidates.sort(sortNumber);
    for (var key in candidates) {
      if (candidates.hasOwnProperty(key)) {
        var region = getRegion(candidates[key].regionId);
        if (region && region.hasInner()) {
          return region;
        }
      }
    }

    return null;
  }

  Region.getAllRegions = function() {
    return regions;
  };

  p.absorb = function(arc, r1, r2) {
    // ���յ����壬 ������goodNeighbor�����߷ǿյ�һ��
    var points = arc.getPoints(),
      self = this;
    points.forEach(function(ptIndex) {
      KT.Picture.setRegionId(ptIndex, self.regionId);
      self.addInnerPoint(ptIndex);
    });

    delete r1.neighbors[r2.regionId];
    delete r2.neighbors[r1.regionId];
    arc.clear();
  };

  p.addSeed = function(pixel) {
    this.seeds.push(pixel);
    KT.Picture.setRegionId(pixel, this.regionId);
  };

  p.addInnerPoint = function(pixel) {
    this.inners.push(pixel);
  };

  p.addNeighbor = function (regionId, arc) {
    // TQ.Assert.isFalse(this.hasNeighbor(regionId)); 与它已经有了一个边？合并此边
    // TQ.Assert.isTrue(regionId !== this.regionId); 相邻区域ID相同，==》原来的边界，变成了内部点
    if (this.regionId === regionId) {
      // console.error("same region, arc becomes inners");
      return arc.toInners(regionId);
    }
    if (this.hasNeighbor(regionId)) {
      arc.mergeTo(this.neighbors[regionId]);
    } else {
      this.neighbors[regionId] = arc;
    }
  };

  p.dump = function() {
    var i,
      msg = "seed: " + this.regionId;

    for (i = 0; i < Math.min(3, this.inners.length); i++) {
      if (i===0) {
        msg += " inners(" + this.inners.length + "):";
      }

      msg += " " + this.inners[i];
    }

    msg += "\n  arcs(" + this.getArcAmount() + "):";
    i=0;
    for (key in this.neighbors) {
      if (!this.neighbors.hasOwnProperty(key)) {
        continue;
      }
      var arc = this.neighbors[key];
      msg += "\n   " + arc.toString();
      if (i++ >= 2) {
        msg += "...";
        break
      }
    }

    TQ.Log.info(msg);
    return msg;
  };

  p.explode = function () {
    var success = true;
    if (this.hasInner()) {
      console.error("must be zero area!!!");
      return success;
    }

    for (var idString in this.neighbors) {
      if (!this.neighbors.hasOwnProperty(idString)) {
        continue;
      }

      var id = parseInt(idString),
        arc = this.neighbors[id],
        neighbor = Region.getRegion(id);

      if (neighbor.hasInner()) {
        neighbor.absorb(arc, neighbor, this);
        continue;
      }

      var goodNeighbor = findGoodNeighbor(arc, this.regionId);
      if (goodNeighbor && goodNeighbor.hasInner()) {
        goodNeighbor.absorb(arc, neighbor, this);
        continue;
      }

      console.error(this.regionId, arc.regionId1, arc.regionId2);
      success = false;
    }

    return success;
  };

  p.getArcAmount = function () {
    var i = 0;
    for (key in this.neighbors) {
      if (!this.neighbors.hasOwnProperty(key)) {
        continue;
      }
      i++;
    }
    return i;
  };

  p.grow = function() {
    var i,
      ptIndex,
      degree;

    for (i = 0; i < this.seeds.length; i++) {
      ptIndex = this.seeds[i];
      var x = KT.Picture.getX(ptIndex),
        y = KT.Picture.getY(ptIndex);

      degree = 0;
      degree += this.tryGrowTo(x,   y-1);
      degree += this.tryGrowTo(x-1, y);
      degree += this.tryGrowTo(x+1, y);
      degree += this.tryGrowTo(x,   y+1);

      if (isInnerPoint(degree)) {
        this.seeds.splice(i, 1);
        this.inners.push(ptIndex);
        i--;
      } else if (isBoundaryPoint(degree)) {
        this.seeds.splice(i, 1);
        i--;
        TQ.Assert.isTrue(neighboreId != Region.TYPE_UNKONWN_REGION);
        if (!this.hasNeighbor(neighboreId)) {
          var arc1 = KT.Arc.create(this.regionId, neighboreId);
          this.addNeighbor(neighboreId, arc1);
          if (isSharedEdge) {
            KT.Region.getRegion(neighboreId).addNeighbor(this.regionId, arc1);
          }
        }

        this.neighbors[neighboreId].add(ptIndex);
      }
    }
  };

  p.hasInner = function () {
    return (this.inners.length > 0);
  };

  p.tryGrowTo = function(x, y) {
    // �ڲ��㣺 ��Χ����ͬ����ĵ�, ������grow��
    // Region�߽�㣺��Χ�� free�ĵ㣬 �п�����grow
    // ͼ��߽��

    if (KT.Picture.isOutOfBoundary(x, y)) {
      return PT_TYPE_OUT_OF_BOUNDARY;
    }

    var picture = KT.Picture.getAllPixels();
    var ptIndex = KT.Picture.getIndex(x, y);

    if (KT.Picture.hasRegionId(ptIndex)) {// ToDo: �п��ܺϲ�����region
      if (this.inThisRegion(ptIndex)) {
        return PT_TYPE_SAME_REGION;
      } else {
        neighboreId = KT.Picture.getRegionIdByIndex(ptIndex);
        return PT_TYPE_BOUNDARY;
      }

    } else if (KT.Picture.isInWaterLevel(ptIndex)) {
      this.addSeed(ptIndex);
      return PT_TYPE_SAME_REGION;
    }
    return PT_TYPE_UNKNOWN;
  };

  p.inThisRegion = function(ptIndex) {
    return (KT.Picture.getRegionIdByIndex(ptIndex) === this.regionId);
  };

  p.hasNeighbor = function(id) {
    return this.neighbors.hasOwnProperty(id);
  };

  // ȥ��������
  //  ���С�� ���б߶������ߣ�С���� ���е�
  // 1024* 1024 ��/ 10000������: 100���㣬ÿ����
  // Region
  p.isNoise = function(noiseLevel) {
    var arc,
      result = true;
    for (var idString in this.neighbors) {
      if (!this.neighbors.hasOwnProperty(idString)) {
        continue;
      }

      var id = parseInt(idString);
      arc = this.neighbors[id];
      if (arc.height > noiseLevel) {
        result = false;
        break;
      }
    }

    return result;
  };

  p.isValidBkg = function (bkgAmount) {
    var n = this.inners.length;
    return (n > 0) && (bkgAmount/n  > 0.6);
  };

  p.merge = function(height) {
    var ids = [],
      arc;
    for (var idString in this.neighbors) {
      if (!this.neighbors.hasOwnProperty(idString)) {
        continue;
      }

      var id = parseInt(idString);
      arc = this.neighbors[id];
      if (!arc) {
        console.error("arc is deleted: ", id);
        continue;
      }

      if ((arc.height < height) && (ids.indexOf(id) < 0)) {
        // console.log(this.regionId, "<->", id, arc.height);
        ids.push(id);
      } else {
        // console.log(this.regionId, " | ", id, arc.height);
      }
    }

    return ids;
  };

  p.mergeTo = function(targetId) {
    var n = this.inners.length,
      targetRegion = Region.getRegion(targetId),
      ptIndex;

    for (var i=0; i < n; i++) {
      ptIndex = this.inners[i];
      targetRegion.addInnerPoint(ptIndex);
      KT.Picture.setRegionId(ptIndex, targetId);
    }
    this.inners.splice(0);

    for (var idString in this.neighbors) {
      if (!this.neighbors.hasOwnProperty(idString)) {
        continue;
      }

      var id = parseInt(idString),
        arc = this.neighbors[id],
        neighbor = Region.getRegion(id);

      arc.setRegionId(targetId);
      neighbor.changeNeighbor(this.regionId, targetId);
      targetRegion.addNeighbor(id, arc);
    }
    this.neighbors.splice(0);
  };

  p.changeNeighbor = function(sId, tId) {
    var arc = this.neighbors[sId];
    delete this.neighbors[sId];
    this.addNeighbor(tId, arc);
    arc.updateRegionId(sId, tId);
  };

  // shared:
  function isInnerPoint(degree) {
    return (degree < PT_TYPE_BOUNDARY);
  }

  function isBoundaryPoint(degree) {
    return ((degree >= PT_TYPE_BOUNDARY) && (degree < PT_TYPE_UNKNOWN));
  }

  function cleanBorder(bkgRegions) {
    var cleaned = 0,
      width  = KT.Picture.getWidth(),
      height = KT.Picture.getHeight();
    var MAX_X_BORDER = Math.round(width * 0.2);
    var x = 0,
      y,
      rId0,
      rId1,
      region;
    for (y = 0; y < height; y++) {
      for (x = 0; x < 5; x++) {
        rId0 = KT.Picture.getRegionIdByXY(x, y);
        if (inBkg(rId0)) {
          continue;
        }
        for (var x1 = 0; x1 < MAX_X_BORDER; x1++) {
          rId1 = KT.Picture.getRegionIdByXY(x1, y);
          if (inBkg(rId1)) {
            region = getRegion(rId0);
            region.mergeTo(rId1);
            console.log("merged to ", rId1);
            cleaned = 1;
            break;
          }
        }
      }
    }

    function inBkg(id) {
      return bkgRegions.indexOf(id) >= 0;
    }

    return cleaned;
  }

  KT.Region = Region;
  Region.cleanBorder = cleanBorder;
  Region.create = create;
  Region.getRegion = getRegion;
  Region.growConnect = growConnect;
  Region.init = init;
})();
