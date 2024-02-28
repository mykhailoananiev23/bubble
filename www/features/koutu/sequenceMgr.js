/**
 * Created by Andrewz on 10/9/2016.
 */
var KT = KT || {};
(function() {
  var MAX_TIME_PER_TASK = 60000;
  function SequenceMgr() {
  }

  var sequence,
    nextTimer = null,
    nextTaskId = -1,
    manualModeOn = false,
    paused = false,
    readyForNext = false,
    hasCompleted = false;

  SequenceMgr.updateCounter = 0;
  SequenceMgr.isPaused = function () {
    return (manualModeOn && paused);
  };

  SequenceMgr.pause = function() {
    if (KT.Config.debugModeOn) {
      manualModeOn = true;
    }
  };

  SequenceMgr.start = function(data) {
    sequence = data;
    hasCompleted = false;
    doTask(0);
  };

  SequenceMgr.toNext = function () {
    if (manualModeOn) {
      if (!readyForNext) {
        paused = true;
        return;
      }
      paused = false;
      readyForNext = false;
    }
    if (hasCompleted) {
      return;
    }

    if (!!nextTimer) {
      clearTimeout(nextTimer);
      nextTimer = null;
    }

    if ((nextTaskId >= 1) &&  (sequence[nextTaskId - 1].after)) {
      sequence[nextTaskId - 1].after.apply();
    }

    if (nextTaskId >= 0) {
      doTask(nextTaskId);
    }
  };

  SequenceMgr.toNextManually = function () {
    readyForNext = true;
  };

  function setupNextTask(i) {
    if (i < sequence.length) {
      nextTaskId = i;
      nextTimer = setTimeout(function() {
        SequenceMgr.toNext();
      }, MAX_TIME_PER_TASK);
    } else {
      hasCompleted = true;
    }
  }


  function doTask(i) {
    SequenceMgr.updateCounter = 0;
    TQ.Log.info(new Date().toLocaleString() + "doTask:" + i + " " + sequence[i].fn.name);
    sequence[i].fn.apply();
    i++;
    if (i <= sequence.length) {
      setupNextTask(i);
    }
  }

  KT.SequenceMgr = SequenceMgr;
})();
