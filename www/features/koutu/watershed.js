/**
 * Created by Andrewz on 10/3/2016.
 */

var KT = KT ||{};

(function watershed() {
  function start(pixels) {
    var pixelBins = KT.Helper.sort256Bins(KT.Helper.initialize(pixels)),
      binAmount = pixelBins.length,
      regions,
      arcs;

    KT.Region.init();
    KT.Arc.init();
    regions = KT.Region.getAllRegions();
    arcs = KT.Arc.getAllArcs();

    for (var i = 0; i < binAmount; i++) {
      if (pixelBins[i].length > 0) {
        // console.log("bin: ", i, "pixel: ", pixelBins[i].length);
        KT.Picture.setWaterLevel(i);
        growRegions(regions); // regions and arcs
        findRegions(pixelBins[i], regions, arcs);
      }
    }

    growRegions(regions); // regions and arcs

    console.log("found regions: ", KT.Region.getAllRegions().length);
    if (!KT.Config.isRegionViewer) {
      KT.Arc.refineBoundary();
      KT.Ucm.build(KT.Arc.getAllArcs());
      eraseZeroAreaRegion();
      mergeSmallRegions();
    }

    KT.Selector.onDataReady();
  }

  function eraseZeroAreaRegion() {
    // 0 �����region�� ��ߣ��鵽�ھ������ڲ��㡱
    var regions = KT.Region.getAllRegions(),
      remains = null,
      n,
      region,
      MAX_ITERATION = 3;

    for (var j = 0; j < MAX_ITERATION; j++) {
      remains = [];
      n = regions.length;
      for (var i = 0; i < n; i++) {
        region = regions[i];
        if (region.inners.length === 0) {
          if (!region.explode()) {
            remains.push(region);
          }
        }
      }
      if (remains.length === 0) {
        break;
      }

      regions = remains;
      console.error("remain 0 area regions:", remains.length);
    }

    n = remains.length;
    for (i = 0; i< n; i++) {
      region = remains[i];
      console.error(region.regionId, region.neighbors);
    }
  }

  function findSmallRegions(noiseLevel) {
    var arcs = KT.Arc.getAllArcs(),
      n = arcs.length,
      arc;
    for (var i = 0; i < n; i++) {
      arc = arcs[i];
      if (arc.weight > noiseLevel) {
        break;
      }
      r1 = KT.Region.getRegion(arc.regionId1);
      r2 = KT.Region.getRegion(arc.regionId2);
      var isInner = false;
      if (r1.isNoise(noiseLevel)) {
        isInner = KT.Arc.removeArc(arc.regionId1, arc.regionId2);
        if (isInner) {
          arc.toInners(arc.regionId2);
        }
      } else if (r2.isNoise(noiseLevel)) {
        isInner = KT.Arc.removeArc(arc.regionId2, arc.regionId1);
        if (isInner) {
          arc.toInners(arc.regionId1);
        }
      }
    }

    return KT.Arc.getArcsTBD();
  }

  function mergeSmallRegions() {
    var noiseLevel = determineNoiseLevel(),
      arcsTBD = findSmallRegions(noiseLevel);

    arcsTBD.forEach(function(arc) {
      sRegion = KT.Region.getRegion(arc.sRegionId);
      sRegion.mergeTo(arc.tRegionId);
    });

    arcsTBD.splice(0);
    // �յ�region �������� Ϊ��ID��һ���ԣ� ���ǣ�������ʹ���ˡ���Ϊ���� ��ͱ߶��ǿ���
  }

  function determineNoiseLevel() {
    // var n = KT.Region.getAllRegions().length - 1000; // ����1000������
    return KT.Config.noiseLevel;
  }
  function findRegions(section, regions, arcs) {
    var amount = section.length;
    var r1 = null;
    for (var i = 0; i < amount; i++) {
      if (!KT.Picture.hasRegionId(section[i])) {
        r1 = KT.Region.create();
        r1.addSeed(section[i]);
        r1.grow();
        regions.push(r1);
      }
    }
  }

  function growRegions(regions) {
    for (var i = 0; i < regions.length; i++) {
      regions[i].grow();
    }
  }

  watershed.start = start;
  KT.watershed = watershed;
})();
