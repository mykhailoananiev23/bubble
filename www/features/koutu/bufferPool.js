/**
 * Created by Andrewz on 11/13/2016.
 */
//�����͹���pixelsBuffers�� �Ա���Ƶ���ط���ͻ����ڴ棬���Ч�ʡ�
var KT = KT ||{};
KT.BufferPool = (function(){
  var pbImageWidth,
    pbImageHeight,
    renderer;

  var buffers = [],
    usedBuffers = [];

  return {
    init: init,
    readPixels: readPixels,
    screen2Texture: screen2Texture,
    create:create,
    release: release,
    releaseTexture: releaseTexture
  };

  function create() {
    var n = 4 * pbImageWidth * pbImageHeight;
    return new Uint8Array(n); // be careful - allocate memory only once
  }

  function getBuffer() {
    var buffer = usedBuffers.pop();
    if (!buffer) {
      buffer = create();
    }

    buffers.push(buffer);
    TQ.Log.debugInfo("Buffers length:", buffers.length);
    return buffer;
  }

  function init(pbImageWidth_, pbImageHeight_, renderer_) {
    pbImageWidth = pbImageWidth_;
    pbImageHeight = pbImageHeight_;
    renderer = renderer_;
    buffers.splice(0);
    usedBuffers.splice(0);
  }

  function readPixels() {
    var pixels = getBuffer();
    var _gl = renderer.getContext();
    //readPixels�Զ���pixel��ֵתΪ[0,255]��������[0, 1]��
    _gl.readPixels(0, 0, pbImageWidth, pbImageHeight, _gl.RGBA, _gl.UNSIGNED_BYTE, pixels);
    TQ.Log.debugInfo("ready data: ", pbImageWidth, '*', pbImageHeight);

    /*
         var v = 9;
         for (var i=0; i < n; i+=4) {
         if (i > pbImageWidth * 4 * 2) {
         v = 88;
         }
         pixels[i ] = v;
         pixels[i + 1] = v;
         pixels[i + 2] = v;
         pixels[i + 3] = 0;
         }
         */
    return pixels;
  }

  function screen2Texture(toBeFree) {
    if (!!toBeFree) {
      releaseTexture(toBeFree);
    }

    var pixels = getBuffer();
    var _gl = renderer.getContext();
    //readPixels�Զ���pixel��ֵתΪ[0,255]��������[0, 1]��
    _gl.readPixels(0, 0, pbImageWidth, pbImageHeight, _gl.RGBA, _gl.UNSIGNED_BYTE, pixels);
    // checkValue(pixels);
    return (new THREE.DataTexture(pixels, pbImageWidth, pbImageHeight, THREE.RGBAFormat));
  }

  function release(buffer) {
    usedBuffers.push(buffer);
    var id = buffers.indexOf(buffer);
    buffers.splice(id,1);
  }

  function releaseTexture(texture) {
    var buffer = texture.image.data;
    release(buffer);
    texture.image.data = null;
  }
})();
