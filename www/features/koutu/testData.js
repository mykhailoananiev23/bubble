/**
 * Created by Andrewz on 10/15/2016.
 */
var KT = KT || {};

KT.TestData = (function () {
  return {
    getImageList: getImageList,
    loadTextures: loadTextures
  };

  function getImageList() {
    return [
      // "http://res.cloudinary.com/eplan/image/upload/v1482135837/c267.png",
      // "http://res.cloudinary.com/eplan/image/upload/v1482135767/c266.png",
      "http://res.cloudinary.com/eplan/image/upload/v1482135325/c264.png",
      "../textures/花朵.png"
      // "../textures/嘴唇.png",

      /*            // "../textures/不要再让老婆伤心.jpg",
            // "../textures/test-r-gb-pure.png",
            // "../textures/blue-bkg.jpg",
            //"../故事专题素材/bible/women.png",
             "../textures/ZhiGangsuo.bmp",
             "../textures/不要再让老婆伤心.jpg",
             "../textures/褐色石磨1.jpg",
             "../textures/红色盖子1.jpg",
             "../textures/arts01.jpg",
            "../textures/busket01.jpg",
            "../textures/blue-bkg.jpg",
            "../textures/apple-grey.jpg",
            "../textures/ballPenCap01.jpg",

            // "../textures/test-r-gb.png",

            // "../textures/红色盖子2.jpg",
            // "../textures/红色盖子3.jpg",
            //"../textures/褐色石磨2.jpg",
            //"../textures/褐色石磨3.jpg",

            // "../textures/square-45d.png",
            // "../textures/line2.png",
            // "../textures/line5.png",
            // "../textures/flower2R.png",
            // "../textures/flower3R.png",
            // "../textures/flower4R.png",
            // "../textures/flower6R.png";
            // "../textures/flower3-3R.png",
            // "../textures/flower9R.png",
            // "../textures/flower201R.png",

            // "../textures/head1.png",
            // "../textures/foot2B.png",
            // "../textures/foot1B.png",
            // "../textures/flower1.jpg",
            // "../textures/appleJobs.jpg",
            // "../textures/apple-grey.jpg",
            // "../textures/常州古运河.jpg",
            //'../textures/ZhiGang_半身照.jpg'
*/
    ];
  }
  function loadTextures(url) {
    var texture;
    if (!url) {
      url = "../textures/blue-bkg.jpg";
    }
    if (typeof url === 'string') { // 包括：image64和有File转来的临时url
      texture = new THREE.TextureLoader().load(url, onLoaded);
    } else {
      console.error("wrong image url!");
    }
    return texture;
  }
})();
