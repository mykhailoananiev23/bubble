/**
 * Created by Andrewz on 10/8/2016.
 */
/* ѡ��1���㣬 �ҵ����ڻ���region��ID��
 ���ݵ�ǰ ϸ�ڳ̶�height�� �ҵ���region���ڵ�����region�����������������л���region

 �ϲ��������򣬽��ýϴ�����������ID��
  */

// ultrametric contour map: UCM

var KT = KT || {};

(function() {
  function Selector() {
  }

  var CANVAS_HEIGHT,
    CANVAS_HEIGHT_1,
    MODE_NEW = 1,
    MODE_ADD = 2,
    MODE_SUB = 3,
    height, // height of the UCM tree;
    dataReady = false,
    currentSeedRegionId = -1, //KT.Region.TYPE_UNKONWN_REGION,
    selectedRegions = [],
    mouse = new THREE.Vector2();

  Selector.onChange = null;

  function autoSelect() {
    pickByXy(KT.Picture.nc2WcX(KT.Config.leftUpX0), KT.Picture.nc2WcY(KT.Config.leftUpY0), MODE_NEW);
    setTimeout(function(){
      pickByXy(KT.Picture.nc2WcX(KT.Config.rightUpX0), KT.Picture.nc2WcY(KT.Config.rightUpY0), MODE_ADD);
    }, 1000);
  }

  function init(renderer, canvasHeight) {
    CANVAS_HEIGHT = canvasHeight;
    CANVAS_HEIGHT_1 = CANVAS_HEIGHT -1;
  }

  function onDataReady() {
    dataReady = true;
    renderer.domElement.addEventListener('mousemove', onMouseSelect);
    setHeight(KT.Config.UCMHeight);
    // autoSelect();
  }

  function onMouseSelect(e) {
    if (dataReady) {
      if (e.ctrlKey && e.altKey) {
        mode = MODE_NEW;
        KT.Config.isSingleRegion = true;
        KT.Config.isRegionViewer = true;
      } else {
        KT.Config.isSingleRegion = false;
        KT.Config.isRegionViewer = false;
        if (e.ctrlKey) {
          mode = MODE_ADD;
        } else if (e.altKey) {
          mode = MODE_SUB;
        } else {
          return;
        }
      }

      mouse.x = e.clientX;
      mouse.y = e.clientY;
      var x = mouse.x,
        y = CANVAS_HEIGHT - mouse.y;

      y = Math.min(CANVAS_HEIGHT_1, y);
      pickByXy(x, y, mode);
    }
  }

  function pickByXy(x, y, mode) {
    if (!mode) {
      mode = MODE_NEW;
    }

    var seedRegionId = KT.Picture.getRegionIdByXY(x, y);
    if (!seedRegionId) {
      TQ.Log.error("find null region at (" + x + "," + y + " ):");
    } else {
      if ((KT.Config.isRegionViewer) && (currentSeedRegionId !== seedRegionId)) {
        console.log(x, y, "regionId:", seedRegionId);
      }

      if (KT.Config.isRegionViewer) {
        if (mode === MODE_NEW) {
          selectedRegions.splice(0);
          if (KT.Config.isSingleRegion) {
            selectedRegions.push(seedRegionId);
            currentSeedRegionId = seedRegionId;
          }
        }
      }

      if ((currentSeedRegionId !== seedRegionId) &&
                (selectedRegions.indexOf(seedRegionId) < 0)) {
        currentSeedRegionId = seedRegionId;
        KT.Region.getRegion(seedRegionId).dump();
        selectedRegions = refine(seedRegionId, mode);
      }
    }
    return selectedRegions;
  }

  function refine(seedRegionId, mode) {
    if (seedRegionId === -1) {
      return selectedRegions;
    }

    selectedRegions = (KT.Config.isSingleRegion) ? [seedRegionId] : pick(seedRegionId, mode);
    if (Selector.onChange) {
      Selector.onChange.call(this, selectedRegions);
    }

    return selectedRegions;
  }

  function pick(seedRegionId, mode) {
    var regionIds = (mode === MODE_ADD? selectedRegions: []),
      seeds = [seedRegionId],
      newSeeds = null,
      region;

    for (var i = 0; i< seeds.length; i++) {
      region = KT.Region.getRegion(seeds[i]);
      if (region) {
        newSeeds = region.merge(height);
        regionIds.push(seeds[i]);
        newSeeds.forEach(addSeed);
      } else {
        TQ.Log.error("find null region, id = ", seeds[i]);
      }
    }

    function addSeed(item) {
      if (seeds.indexOf(item) < 0) {
        seeds.push(item);
      }
    }

    var msg = "";
    for (i=0; i< Math.min(3, regionIds.length); i++) {
      msg += regionIds[i] + ",";
    }
    TQ.Log.info(regionIds.length + "regions combined:", msg);
    return regionIds;
  }

  function setHeight(h) {
    height = h;
    refine(currentSeedRegionId);
    console.log("UCMHeight: = ",  h);
  }

  Selector.init = init;
  Selector.onDataReady = onDataReady;
  Selector.pick = pick;
  Selector.pickByXy = pickByXy;
  Selector.setHeight = setHeight;
  KT.Selector = Selector;
})();
