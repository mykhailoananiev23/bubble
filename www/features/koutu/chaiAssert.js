
var TQ= TQ || {};
var chai = chai ||{};

function notImplemented() {
}

chai.assert = (function(){
  return {
    isFalse: notImplemented,
    isTrue: notImplemented,
    isNotNull: notImplemented
  }
})();

TQ.Assert = chai.assert;
