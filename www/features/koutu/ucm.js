/**
 * Created by Andrewz on 10/8/2016.
 */
// ultrametric contour map: UCM

var KT = KT || {};

(function() {
  var arcs = null;
  function Ucm(arcs) {
  }

  Ucm.build = function(_arcs) {
    arcs = _arcs;
    Ucm.refine();
  };

  Ucm.refine = function () {
    calWeightAll();
    sort();
    setUcmHeight();
  };

  function sort() {
    arcs.sort(arcCompare);
  }

  function setUcmHeight() {
    var n = arcs.length;

    for (var i = 0; i< n; i++) {
      arcs[i].height = i / n;
    }
  }

  function arcCompare(a1, a2) {
    if (a1.weight < a2.weight) {
      return -1;
    } else if (a1.weight > a2.weight) {
      return 1;
    }

    return 0;
  }

  function calWeightAll() {
    var arcAmont = arcs.length;
    for (i = 0; i < arcAmont; i++) {
      arcs[i].calWeight();
    }
  }

  KT.Ucm = Ucm;
})();
