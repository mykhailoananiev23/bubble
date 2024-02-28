/**
 * Created by Andrewz on 12/13/2016.
 */
var KT = KT || {};
KT.Tool = KT.Tool || {};
(function () {
  KT.Tool.autoTest = autoTest;
  var testId = 0;
  var timestamp = new Date(),
    prefix = (timestamp.getMonth() + 1) +
            '-' + timestamp.getDate() +
            ', ' + timestamp.getHours() +
            '-' + timestamp.getMinutes() +
            '-' + timestamp.getSeconds();

  function autoTest() {
    // KT.Config.debugModeOn = true;
    var testData = KT.TestData.getImageList();
    var matType = 20;
    if (testId < testData.length) {
      koutuMain(testData[testId], matType, function () {
        if (testData.length > 1 && !KT.Config.debugModeOn) {
          KT.Tool.saveImage("koutuTest" + testId + ', ' + prefix + ".png");
          testId++;
          autoTest();
        }
      })
    }
  }
}());
