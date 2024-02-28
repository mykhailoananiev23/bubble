/**
 * Created by Andrewz on 12/5/2016.
 * 可视化指定的区域
 */

var KT = KT || {};
KT.Tool = KT.Tool || {};
(function () {
  KT.Tool.visualize = visualize;
  function visualize(regionId) {
    if (!regionId) {
      regionId = 0;
    }
    var selectedRegions = [regionId];
    maskMaterial.uniforms.regions.value = selectedRegions;
    maskMaterial.uniforms.realRegionAmount.value = selectedRegions.length;
    maskMaterial.needsUpdate = true;
    KT.SequenceMgr.updateCounter = 0;
    state = STATE_MASK;
    originalObj.material = maskMaterial;
    maskMaterial.needsUpdate = true;
    materialOriginal.needsUpdate = true;
    scene.remove(gPbObj);
    scene.remove(originalObj);
    scene.add(originalObj);
  }
}());
