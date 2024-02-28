var shaderLib={"fs-applyMask":"uniform sampler2D srcImage;uniform sampler2D maskImage;varying vec2 vUv;void main(){vec4 srcColor=texture2D(srcImage,vUv),maskColor=texture2D(maskImage,vUv);if(maskColor.r>0.3){gl_FragColor=vec4(srcColor.rgb,1.0);}else{gl_FragColor=vec4(0.0,0.0,0.0,0.0);}}","fs-bilateral":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;uniform vec2 direction;uniform int alphaOnly;varying vec2 vUv;float deltaD=10.0;float deltaR=0.5;vec4 originalColor;float weightFactor(vec2 offset,vec4 color1,vec4 color2){offset=(offset*10.0)/3.0;color1=color1*10.0;color2=color2*10.0;float geoDist2=(offset.x*offset.x)+(offset.y*offset.y);float spectralDist2=distance(color1.rgb,color2.rgb);spectralDist2=spectralDist2*spectralDist2;float exponent=-0.5*((geoDist2/(deltaD*deltaD))+(spectralDist2/(deltaR*deltaR)));return exp(exponent);}vec4 gaussian13(){vec4 color=vec4(0.0);vec2 off1=vec2(1.0/imgWidth,1.0/imgHeight)*direction;vec2 off2=vec2(2.0/imgWidth,2.0/imgHeight)*direction;vec2 off3=vec2(3.0/imgWidth,3.0/imgHeight)*direction;vec2 off4=vec2(4.0/imgWidth,4.0/imgHeight)*direction;originalColor=texture2D(srcImage,vUv);vec4 c0=originalColor;vec4 c1=texture2D(srcImage,vUv+off1);vec4 c2=texture2D(srcImage,vUv-off1);vec4 c3=texture2D(srcImage,vUv+off2);vec4 c4=texture2D(srcImage,vUv-off2);vec4 c5=texture2D(srcImage,vUv+off3);vec4 c6=texture2D(srcImage,vUv-off3);vec4 c7=texture2D(srcImage,vUv+off4);vec4 c8=texture2D(srcImage,vUv-off4);float factor0=1.0;float factor1=weightFactor(direction,c0,c1);float factor2=weightFactor(-direction,c0,c2);float factor3=weightFactor(direction*2.0,c0,c3);float factor4=weightFactor(-direction*2.0,c0,c4);float factor5=weightFactor(direction*3.0,c0,c5);float factor6=weightFactor(-direction*3.0,c0,c6);float factor7=weightFactor(direction*4.0,c0,c7);float factor8=weightFactor(-direction*4.0,c0,c8);float totalFactor=factor0;color=c0*factor0;color+=(c1*factor1);totalFactor+=factor1;color+=(c2*factor2);totalFactor+=factor2;color+=(c3*factor3);totalFactor+=factor3;color+=(c4*factor4);totalFactor+=factor4;color+=(c5*factor5);totalFactor+=factor5;color+=(c6*factor6);totalFactor+=factor6;color+=(c7*factor7);totalFactor+=factor7;color+=(c8*factor8);totalFactor+=factor8;return color/totalFactor;}void main(){vec4 color=gaussian13();if(alphaOnly==1){gl_FragColor=vec4(originalColor.xyz,color.w);}else{gl_FragColor=color;}}","fs-bkg":"#define FULL_256_SIZE 256 // (128 + 1)\r\n#define FULL_DISK_SIZE 9   // pixels\r\n#define BUCKET_SIZE 10  // HALF_DISK_SIZE * 2;\r\nuniform sampler2D srcImage;uniform vec3 bkgRefHisto[FULL_256_SIZE];uniform float pOfBkgMax;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv10;varying vec2 vUv;varying vec2 vUv12;varying vec2 vUv20;varying vec2 vUv21;varying vec2 vUv22;uniform float imgWidth;uniform float imgHeight;uniform int useRGBColor;ivec3 buckets[BUCKET_SIZE];vec3 statusL[BUCKET_SIZE];int headX=0,headY=0,headZ=0;void cleanBucketsAndStatus(){headX=0;headY=0;headZ=0;for(int i=0;i<BUCKET_SIZE;i++){buckets[i]=ivec3(0,0,0);statusL[i]=vec3(0.0,0.0,0.0);}}void sendToBucket(vec3 pt,inout vec3 status[BUCKET_SIZE]){int pX=int(pt.x),pY=int(pt.y),pZ=int(pt.z);bool notFoundX=true,notFoundY=true,notFoundZ=true;for(int b=0;b<BUCKET_SIZE;b++){if(notFoundX){if(b>=headX){(buckets[b]).x=pX;headX+=1;}if((buckets[b]).x==pX){(status[b]).x+=1.0;notFoundX=false;}}if(notFoundY){if(b>=headY){(buckets[b]).y=pY;headY+=1;}if((buckets[b]).y==pY){(status[b]).y+=1.0;notFoundY=false;}}if(notFoundZ){if(b>=headZ){(buckets[b]).z=pZ;headZ+=1;}if((buckets[b]).z==pZ){(status[b]).z+=1.0;notFoundZ=false;}}}}void getStatus(vec3 p[FULL_DISK_SIZE],inout vec3 status[BUCKET_SIZE]){for(int i=0;i<FULL_DISK_SIZE;i++){sendToBucket(p[i],status);}for(int i=0;i<BUCKET_SIZE;i++){status[i]=status[i]/float(FULL_DISK_SIZE);}}vec3 getHisto(vec3 status[BUCKET_SIZE],int bin256Index){vec3 h=vec3(0.0);for(int i=0;i<BUCKET_SIZE;i++){if((i<headX)&&(bin256Index>=(buckets[i]).x)){h.x+=(status[i]).x;}if((i<headY)&&(bin256Index>=(buckets[i]).y)){h.y+=(status[i]).y;}if((i<headZ)&&(bin256Index>=(buckets[i]).z)){h.z+=(status[i]).z;}}return h;}vec3 calX2(){vec3 x2=vec3(0.0);vec3 hLi,hRi,base,diff;for(int i=0;i<FULL_256_SIZE;i++){hLi=getHisto(statusL,i);hRi=bkgRefHisto[i];diff=hLi-hRi;base=hLi+hRi;if(base.x>0.0){x2.x+=((diff.x*diff.x)/base.x);}if(base.y>0.0){x2.y+=((diff.y*diff.y)/base.y);}if(base.z>0.0){x2.z+=((diff.z*diff.z)/base.z);}}x2=x2/float(FULL_256_SIZE);return x2;}void takeSample(out vec3 p[FULL_DISK_SIZE]){p[0]=255.0*texture2D(srcImage,vUv00).xyz;p[1]=255.0*texture2D(srcImage,vUv01).xyz;p[2]=255.0*texture2D(srcImage,vUv02).xyz;p[3]=255.0*texture2D(srcImage,vUv10).xyz;p[4]=255.0*texture2D(srcImage,vUv).xyz;p[5]=255.0*texture2D(srcImage,vUv12).xyz;p[6]=255.0*texture2D(srcImage,vUv20).xyz;p[7]=255.0*texture2D(srcImage,vUv21).xyz;p[8]=255.0*texture2D(srcImage,vUv22).xyz;}vec3 calPBkg(vec3 diskL[FULL_DISK_SIZE]){cleanBucketsAndStatus();getStatus(diskL,statusL);vec3 pBkg3=calX2();return pBkg3;}bool isBkg(vec3 x2Dist){float pb=1.0-max(max(x2Dist.r,x2Dist.g),x2Dist.b);if(pb<pOfBkgMax){return false;}return true;}void main(){vec3 p[FULL_DISK_SIZE];takeSample(p);vec3 pBkg3=calPBkg(p);if(isBkg(pBkg3)){gl_FragColor=vec4(1.0,1.0,1.0,1.0);}else{gl_FragColor=vec4(0.0,0.0,0.0,0.0);}}","fs-cieLab2Rgb":"#define REF_X 95.047\r\n#define REF_Y 100.000\r\n#define REF_Z 108.883\r\nuniform sampler2D srcImage;varying vec2 vUv;vec3 xyz2Rgb(vec3 xyzColor){float X=xyzColor.r/100.0;float Y=xyzColor.g/100.0;float Z=xyzColor.b/100.0;float R=((X*3.2406)+(Y*-1.5372))+(Z*-0.4986);float G=((X*-0.9689)+(Y*1.8758))+(Z*0.0415);float B=((X*0.0557)+(Y*-0.2040))+(Z*1.0570);if(R>0.0031308){R=(1.055*pow(R,1.0/2.4))-0.055;}else{R=12.92*R;}if(G>0.0031308){G=(1.055*pow(G,1.0/2.4))-0.055;}else{G=12.92*G;}if(B>0.0031308){B=(1.055*pow(B,1.0/2.4))-0.055;}else{B=12.92*B;}R=R*255.0;G=G*255.0;B=B*255.0;return vec3(R,G,B);}vec3 cieLab2Xyz(vec4 labColor){labColor=labColor*255.0;float CIE_L=(labColor.r/255.0)*100.0,CIE_a=labColor.g-128.0,CIE_b=labColor.b-128.0;float Y=(CIE_L+16.0)/116.0;float X=(CIE_a/500.0)+Y;float Z=Y-(CIE_b/200.0);if(pow(Y,3.0)>0.008856){Y=pow(Y,3.0);}else{Y=(Y-(16.0/116.0))/7.787;}if(pow(X,3.0)>0.008856){X=pow(X,3.0);}else{X=(X-(16.0/116.0))/7.787;}if(pow(Z,3.0)>0.008856){Z=pow(Z,3.0);}else{Z=(Z-(16.0/116.0))/7.787;}X=REF_X*X;Y=REF_Y*Y;Z=REF_Z*Z;return vec3(X,Y,Z);}void main(){vec4 labColor=texture2D(srcImage,vUv);vec3 xyzColor=cieLab2Xyz(labColor);vec3 rgbColor=xyz2Rgb(xyzColor);gl_FragColor=vec4(rgbColor/255.0,labColor.a);}","fs-closeShape":"uniform sampler2D srcImage;uniform sampler2D originalImage;uniform float imgWidth;uniform float imgHeight;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv10;varying vec2 vUv;varying vec2 vUv12;varying vec2 vUv20;varying vec2 vUv21;varying vec2 vUv22;bool isInObj(vec4 color){return color.a>=0.5;}float diff(vec4 color,vec2 direction){vec2 oneStep=(direction/length(direction))*vec2(1.0/imgWidth,1.0/imgHeight);vec4 inner=texture2D(srcImage,vUv+(oneStep*2.0));if(!isInObj(inner)){oneStep=-oneStep;inner=texture2D(srcImage,vUv+(oneStep*2.0));}if(!isInObj(inner)){return 1.0;}vec4 p[3];p[0]=texture2D(srcImage,vUv+(oneStep*3.0));p[1]=texture2D(srcImage,vUv+(oneStep*4.0));p[2]=texture2D(srcImage,vUv+(oneStep*5.0));float num=1.0;for(int i=0;i<3;i++){if(isInObj(p[i])){num++;inner+=p[i];}}inner=inner/num;return length(color.rgb-inner.rgb);}float pOfInner(vec4 color){vec4 p00=texture2D(srcImage,vUv00);vec4 p01=texture2D(srcImage,vUv01);vec4 p02=texture2D(srcImage,vUv02);vec4 p10=texture2D(srcImage,vUv10);vec4 p12=texture2D(srcImage,vUv12);vec4 p20=texture2D(srcImage,vUv20);vec4 p21=texture2D(srcImage,vUv21);vec4 p22=texture2D(srcImage,vUv22);int caseCode=0;float dx=0.0,dy=0.0;if(isInObj(p01)){dx+=-1.0;caseCode+=4;}if(isInObj(p21)){dx+=1.0;caseCode+=1;}if(isInObj(p12)){dy+=1.0;caseCode+=2;}if(isInObj(p10)){dy+=-1.0;caseCode+=8;}float poi=0.0;if(((caseCode==0)||(caseCode==5))||(caseCode==10)){poi=0.0;}else if(caseCode==15){poi=1.0;}else{poi=1.0-diff(color,vec2(dx,dy));}return poi;}void main(){vec4 color=texture2D(srcImage,vUv);if(!isInObj(color)){vec4 originalColor=texture2D(originalImage,vUv);if(pOfInner(originalColor)>0.9){color=vec4(originalColor.rgb,1.0);}}gl_FragColor=color;}","fs-connectivity":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;varying vec2 vUv;uniform int kernalSize;bool isBkg(vec4 color){return color.a<=0.5;}bool isFrg(vec4 color){return color.a>0.5;}float color2RegionId(vec4 color){color=floor((color*255.0)+0.5);return (((color.r*256.0)+color.g)*256.0)+color.b;}vec3 regionId2Color(float regionId){return vec3((regionId/256.0)/256.0,mod(regionId/256.0,255.0),mod(regionId,255.0))/255.0;}float findMax(float maxId,vec2 direction){vec4 color;for(int i=0;i<1024;i++){if(i>kernalSize){break;}vec2 vUv2=vUv+(float(i)*direction);if((((vUv2.x>=0.0)&&(vUv2.x<=1.0))&&(vUv2.y>=0.0))&&(vUv2.y<=1.0)){color=texture2D(srcImage,vUv2);if(isBkg(color)){break;}maxId=max(maxId,color2RegionId(color));}}return maxId;}void main(){vec4 color=texture2D(srcImage,vUv);if(isFrg(color)){float alpha=color.a;float maxId=color2RegionId(color);float dx=1.0/imgWidth;float dy=1.0/imgHeight;maxId=findMax(maxId,vec2(dx,0.0));maxId=findMax(maxId,vec2(-dx,0.0));maxId=findMax(maxId,vec2(0.0,dy));maxId=findMax(maxId,vec2(0.0,-dy));color=vec4(regionId2Color(maxId),alpha);}gl_FragColor=color;}","fs-crop":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;uniform float umin,umax,vmin,vmax;varying vec2 vUv;void main(){vec2 vUv0=vec2(umin,vmin),vUv1=vec2(umax,vmax);vec2 uv=(vUv*(vUv1-vUv0))+vUv0;gl_FragColor=texture2D(srcImage,uv);}","fs-despike":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv10;varying vec2 vUv;varying vec2 vUv12;varying vec2 vUv20;varying vec2 vUv21;varying vec2 vUv22;bool isInObj(vec4 color){return color.a>=0.5;}bool isSpike(vec4 color){vec4 p00=texture2D(srcImage,vUv00);vec4 p01=texture2D(srcImage,vUv01);vec4 p02=texture2D(srcImage,vUv02);vec4 p10=texture2D(srcImage,vUv10);vec4 p12=texture2D(srcImage,vUv12);vec4 p20=texture2D(srcImage,vUv20);vec4 p21=texture2D(srcImage,vUv21);vec4 p22=texture2D(srcImage,vUv22);int caseCode=0;float dx=0.0,dy=0.0;if(isInObj(p01)){dx+=-1.0;caseCode+=4;}if(isInObj(p21)){dx+=1.0;caseCode+=1;}if(isInObj(p12)){dy+=1.0;caseCode+=2;}if(isInObj(p10)){dy+=-1.0;caseCode+=8;}float posibility=0.0;if(((((((caseCode==0)||(caseCode==1))||(caseCode==2))||(caseCode==4))||(caseCode==8))||(caseCode==5))||(caseCode==10)){posibility=1.0;}else{posibility=0.0;}return posibility>0.6;}void main(){vec4 color=texture2D(srcImage,vUv);if(isInObj(color)&&isSpike(color)){color=vec4(0.0,0.0,0.0,0.0);}gl_FragColor=color;}","fs-dilation":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;varying vec2 vUv;uniform int kernalSize;bool isSquare=false;void main(){vec2 onePixel=vec2(1.0/imgWidth,1.0/imgHeight);vec4 color=texture2D(srcImage,vUv);float alpha=color.a;int px,py;int kernalSize2=kernalSize*2;int kernalSizeSquare=kernalSize*kernalSize;for(int x=0;x<1024;x++){if(x>kernalSize2){break;}px=x-kernalSize;for(int y=0;y<1024;y++){if(y>=kernalSize2){break;}py=y-kernalSize;if(isSquare||(!isSquare&&(((px*px)+(py*py))<kernalSizeSquare))){alpha=max(alpha,texture2D(srcImage,vUv+(vec2(px,py)*onePixel)).a);}}}gl_FragColor=vec4(1.0,1.0,1.0,alpha);}","fs-equalize":"#define FULL_256_SIZE 256\r\nuniform sampler2D srcImage;uniform vec3 cdfMin;uniform vec3 cdf[FULL_256_SIZE];uniform int lumOnly;varying vec2 vUv;vec3 getCdf(vec4 labColor){int iLabL=int((labColor.r*255.0)+0.5);int iLabA=int((labColor.g*255.0)+0.5);int iLabB=int((labColor.b*255.0)+0.5);bool findL=true,findA=true,findB=true;vec3 result=vec3(0.0);for(int i=0;i<FULL_256_SIZE;i++){if(findL&&(i>=iLabL)){result.r=(cdf[i]).r;findL=false;}if(findA&&(i>=iLabA)){result.g=(cdf[i]).g;findA=false;}if(findB&&(i>=iLabB)){result.b=(cdf[i]).b;findB=false;}if((!findL&&!findA)&&!findB){return result;}}return result;}void main(){vec4 labColor=texture2D(srcImage,vUv);vec3 cdf=getCdf(labColor);vec3 labColor2=(cdf-cdfMin)/(1.0-cdfMin);if(lumOnly==1){gl_FragColor=vec4(labColor2.r,labColor.g,labColor.b,labColor.a);}else{gl_FragColor=vec4(labColor2,labColor.a);}}","fs-erosion":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;varying vec2 vUv;uniform int kernalSize;bool isSquare=false;void main(){vec2 onePixel=vec2(1.0/imgWidth,1.0/imgHeight);vec4 color=texture2D(srcImage,vUv);float alpha=color.a;int px,py;int kernalSize2=kernalSize*2;int kernalSizeSquare=kernalSize*kernalSize;for(int x=0;x<1024;x++){if(x>kernalSize2){break;}px=x-kernalSize;for(int y=0;y<1024;y++){if(y>=kernalSize2){break;}py=y-kernalSize;if(isSquare||(!isSquare&&(((px*px)+(py*py))<kernalSizeSquare))){alpha=min(alpha,texture2D(srcImage,vUv+(vec2(px,py)*onePixel)).a);}}}gl_FragColor=vec4(color.xyz,alpha);}","fs-gaussian":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;uniform vec2 direction;uniform int alphaOnly;varying vec2 vUv;vec4 originalColor;vec4 gaussian5(){vec4 color=vec4(0.0);vec2 off1=vec2(1.0/imgWidth,1.0/imgHeight)*direction;originalColor=texture2D(srcImage,vUv);color+=(originalColor*0.29411764705882354);color+=(texture2D(srcImage,vUv+off1)*0.35294117647058826);color+=(texture2D(srcImage,vUv-off1)*0.35294117647058826);return color;}vec4 gaussian13(){vec4 color=vec4(0.0);vec2 off1=vec2(1.411764705882353/imgWidth,1.411764705882353/imgHeight)*direction;vec2 off2=vec2(3.2941176470588234/imgWidth,3.2941176470588234/imgHeight)*direction;vec2 off3=vec2(5.176470588235294/imgWidth,5.176470588235294/imgHeight)*direction;originalColor=texture2D(srcImage,vUv);color+=(originalColor*0.1964825501511404);color+=(texture2D(srcImage,vUv+off1)*0.2969069646728344);color+=(texture2D(srcImage,vUv-off1)*0.2969069646728344);color+=(texture2D(srcImage,vUv+off2)*0.09447039785044732);color+=(texture2D(srcImage,vUv-off2)*0.09447039785044732);color+=(texture2D(srcImage,vUv+off3)*0.010381362401148057);color+=(texture2D(srcImage,vUv-off3)*0.010381362401148057);return color;}void main(){vec4 color=gaussian13();if(alphaOnly==1){gl_FragColor=vec4(originalColor.xyz,color.w);}else{gl_FragColor=color;}}","fs-genMask":"uniform sampler2D srcImage;uniform sampler2D mask1Image;uniform int withGpbTexture;varying vec2 vUv;\n#define SIMILARITY_THRESHOLD 0.9\r\nbool isInObj(vec4 color){return color.a>=SIMILARITY_THRESHOLD;}void main(){vec4 srcColor=texture2D(srcImage,vUv),mask1Color=texture2D(mask1Image,vUv);float alpha=0.0;if(isInObj(srcColor)){alpha=1.0;}if((withGpbTexture>0)&&(mask1Color.r>SIMILARITY_THRESHOLD)){alpha+=mask1Color.r;}gl_FragColor=vec4(alpha,alpha,alpha,alpha);}","fs-gpb":"#define FULL_256_SIZE (128 + 1)\r\n#define HISTRO_SCALE 2\r\n#define REF_X 95.047\r\n#define REF_Y 100.000\r\n#define REF_Z 108.883\r\n#define FULL_DISK_SIZE 9   // pixels\r\n#define HALF_DISK_SIZE 5   // pixels\r\n#define BUCKET_SIZE 10  // HALF_DISK_SIZE * 2;\r\nuniform sampler2D srcImage;uniform sampler2D maxTexture;uniform int hasMaxTexture;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv10;varying vec2 vUv;varying vec2 vUv12;varying vec2 vUv20;varying vec2 vUv21;varying vec2 vUv22;uniform float imgWidth;uniform float imgHeight;uniform int useRGBColor;ivec3 buckets[BUCKET_SIZE];vec3 statusL[BUCKET_SIZE];vec3 statusR[BUCKET_SIZE];int headX=0,headY=0,headZ=0;void cleanBucketsAndStatus(){headX=0;headY=0;headZ=0;for(int i=0;i<BUCKET_SIZE;i++){buckets[i]=ivec3(0,0,0);statusL[i]=vec3(0.0,0.0,0.0);statusR[i]=vec3(0.0,0.0,0.0);}}void sendToBucket(vec3 pt,inout vec3 status[BUCKET_SIZE]){int pX=int(pt.x),pY=int(pt.y),pZ=int(pt.z);bool notFoundX=true,notFoundY=true,notFoundZ=true;for(int b=0;b<BUCKET_SIZE;b++){if(notFoundX){if(b>=headX){(buckets[b]).x=pX;headX+=1;}if((buckets[b]).x==pX){(status[b]).x+=1.0;notFoundX=false;}}if(notFoundY){if(b>=headY){(buckets[b]).y=pY;headY+=1;}if((buckets[b]).y==pY){(status[b]).y+=1.0;notFoundY=false;}}if(notFoundZ){if(b>=headZ){(buckets[b]).z=pZ;headZ+=1;}if((buckets[b]).z==pZ){(status[b]).z+=1.0;notFoundZ=false;}}}}void getStatus(vec3 p[HALF_DISK_SIZE],inout vec3 status[BUCKET_SIZE]){for(int i=0;i<HALF_DISK_SIZE;i++){sendToBucket(p[i],status);}for(int i=0;i<BUCKET_SIZE;i++){status[i]=status[i]/float(HALF_DISK_SIZE);}}vec3 getHisto(vec3 status[BUCKET_SIZE],int bin256Index){vec3 h=vec3(0.0,0.0,0.0);for(int i=0;i<BUCKET_SIZE;i++){if((i<headX)&&(bin256Index>=(buckets[i]).x)){h.x+=(status[i]).x;}if((i<headY)&&(bin256Index>=(buckets[i]).y)){h.y+=(status[i]).y;}if((i<headZ)&&(bin256Index>=(buckets[i]).z)){h.z+=(status[i]).z;}}return h;}vec3 calX2(){vec3 x2=vec3(0.0,0.0,0.0);vec3 hLi,hRi,base,diff;int jn;for(int i=0;i<FULL_256_SIZE;i++){jn=i*HISTRO_SCALE;hLi=getHisto(statusL,jn);hRi=getHisto(statusR,jn);diff=hLi-hRi;base=hLi+hRi;if(base.x>0.0){x2.x+=((diff.x*diff.x)/base.x);}if(base.y>0.0){x2.y+=((diff.y*diff.y)/base.y);}if(base.z>0.0){x2.z+=((diff.z*diff.z)/base.z);}}x2=x2/float(FULL_256_SIZE);return x2;}void takeSample(out vec3 p[FULL_DISK_SIZE]){p[0]=255.0*texture2D(srcImage,vUv00).xyz;p[1]=255.0*texture2D(srcImage,vUv01).xyz;p[2]=255.0*texture2D(srcImage,vUv02).xyz;p[3]=255.0*texture2D(srcImage,vUv10).xyz;p[4]=255.0*texture2D(srcImage,vUv).xyz;p[5]=255.0*texture2D(srcImage,vUv12).xyz;p[6]=255.0*texture2D(srcImage,vUv20).xyz;p[7]=255.0*texture2D(srcImage,vUv21).xyz;p[8]=255.0*texture2D(srcImage,vUv22).xyz;}float calPb1(vec3 diskL[HALF_DISK_SIZE],vec3 diskR[HALF_DISK_SIZE]){cleanBucketsAndStatus();getStatus(diskL,statusL);getStatus(diskR,statusR);vec3 gpb3=calX2();return max(max(gpb3.x,gpb3.y),gpb3.z);}float calGpb(vec3 p[FULL_DISK_SIZE]){vec3 diskL[HALF_DISK_SIZE];vec3 diskR[HALF_DISK_SIZE];float pb;diskL[0]=p[3];diskL[1]=p[0];diskL[2]=p[1];diskL[3]=p[2];diskL[4]=p[5];diskR[0]=p[5];diskR[1]=p[8];diskR[2]=p[7];diskR[3]=p[6];diskR[4]=p[3];pb=calPb1(diskL,diskR);return pb;}void main(){vec3 p[FULL_DISK_SIZE];takeSample(p);float gpb=calGpb(p);if(hasMaxTexture>=1){float maxGpb=texture2D(maxTexture,vUv).r;gpb=max(maxGpb,gpb);}gl_FragColor=vec4(gpb,gpb,gpb,1.0);}","fs-mask":"const int MAX_REGION_AMOUNT=1000;uniform sampler2D srcImage;uniform sampler2D regionImage;uniform float transparency;uniform float alphaNotSelected;uniform float alphaSelected;uniform int regionId;uniform int regions[MAX_REGION_AMOUNT];uniform int realRegionAmount;uniform int visualizeRegionOn;varying vec2 vUv;bool isSelected(int id){for(int i=0;i<MAX_REGION_AMOUNT;i++){if(i<realRegionAmount){if(regions[i]==id){return true;}}}return false;}int to255Int(float x){return int(floor((x*255.0)+0.5));}int color2RegionId(vec4 color){return (((to255Int(color.r)*256)*256)+(to255Int(color.g)*256))+to255Int(color.b);}void main(){vec4 color=texture2D(srcImage,vUv);vec4 region=texture2D(regionImage,vUv);int id=color2RegionId(region);float finalTrans;if(isSelected(id)){finalTrans=alphaSelected;}else{finalTrans=alphaNotSelected;}if(visualizeRegionOn>0){color=region;}gl_FragColor=vec4(color.xyz,finalTrans);}","fs-median":"uniform sampler2D srcImage;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv10;varying vec2 vUv;varying vec2 vUv12;varying vec2 vUv20;varying vec2 vUv21;varying vec2 vUv22;vec3 median(vec3 color){vec3 p[9],temp;p[0]=texture2D(srcImage,vUv00).xyz;p[1]=texture2D(srcImage,vUv01).xyz;p[2]=texture2D(srcImage,vUv02).xyz;p[3]=texture2D(srcImage,vUv10).xyz;p[4]=color;p[5]=texture2D(srcImage,vUv12).xyz;p[6]=texture2D(srcImage,vUv20).xyz;p[7]=texture2D(srcImage,vUv21).xyz;p[8]=texture2D(srcImage,vUv22).xyz;for(int i=0;i<9;i++){for(int j=0;j<9;j++){if((p[i]).r>(p[j]).r){temp=p[i];p[i]=p[j];p[j]=temp;}}}return p[4];}void main(){vec4 color=texture2D(srcImage,vUv);color.rgb=median(color.rgb);gl_FragColor=color;}","fs-normalize":"uniform sampler2D srcImage;uniform float minGrey;uniform float maxGrey;varying vec2 vUv;void main(){vec4 color=texture2D(srcImage,vUv);float grey=color.r;grey=(grey-minGrey)/(maxGrey-minGrey);gl_FragColor=vec4(grey,grey,grey,color.a);}","fs-original":"uniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;varying vec2 vUv;uniform float u_kernel[9];vec4 convolutions(){vec2 onePixel=vec2(1.0/imgWidth,1.0/imgHeight);vec4 color=texture2D(srcImage,vUv);vec4 colorSum=((((((((texture2D(srcImage,vUv+(onePixel*vec2(-1,-1)))*u_kernel[0])+(texture2D(srcImage,vUv+(onePixel*vec2(0,-1)))*u_kernel[1]))+(texture2D(srcImage,vUv+(onePixel*vec2(1,-1)))*u_kernel[2]))+(texture2D(srcImage,vUv+(onePixel*vec2(-1,0)))*u_kernel[3]))+(color*u_kernel[4]))+(texture2D(srcImage,vUv+(onePixel*vec2(1,0)))*u_kernel[5]))+(texture2D(srcImage,vUv+(onePixel*vec2(-1,1)))*u_kernel[6]))+(texture2D(srcImage,vUv+(onePixel*vec2(0,1)))*u_kernel[7]))+(texture2D(srcImage,vUv+(onePixel*vec2(1,1)))*u_kernel[8]);float kernelWeight=(((((((u_kernel[0]+u_kernel[1])+u_kernel[2])+u_kernel[3])+u_kernel[4])+u_kernel[5])+u_kernel[6])+u_kernel[7])+u_kernel[8];if(kernelWeight<=0.0){kernelWeight=1.0;}return vec4((colorSum/kernelWeight).rgb,color.a);}void main(){vec4 color=convolutions();gl_FragColor=color;}","fs-peelBkg":"#define FULL_256_SIZE 256\r\n#define MIN_VALID 0.0001\r\nuniform sampler2D srcImage;uniform float imgWidth;uniform float imgHeight;uniform vec3 bkgRefHisto[FULL_256_SIZE];uniform float pOfBkgMax;uniform float pOfBkgMaxB;int hasSameColor=1;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv10;varying vec2 vUv;varying vec2 vUv12;varying vec2 vUv20;varying vec2 vUv21;varying vec2 vUv22;int kernalSize=5;bool isInObj(vec4 color){return color.a>=0.5;}vec3 getPointHisto(ivec3 color,int i){vec3 h=vec3(0.0,0.0,0.0);h.r=i<color.r?0.0:1.0;h.g=i<color.g?0.0:1.0;h.b=i<color.b?0.0:1.0;return h;}vec3 calX2(ivec3 color){vec3 x2=vec3(0.0,0.0,0.0);vec3 hLi,hRi,base,diff;for(int i=0;i<FULL_256_SIZE;i++){hLi=getPointHisto(color,i);hRi=bkgRefHisto[i];diff=hLi-hRi;base=hLi+hRi;if(base.x>MIN_VALID){x2.x+=((diff.x*diff.x)/base.x);}if(base.y>MIN_VALID){x2.y+=((diff.y*diff.y)/base.y);}if(base.z>MIN_VALID){x2.z+=((diff.z*diff.z)/base.z);}}x2=x2/float(FULL_256_SIZE);return x2;}float calPOfBkg(vec4 color){vec4 p00=texture2D(srcImage,vUv00);vec4 p01=texture2D(srcImage,vUv01);vec4 p02=texture2D(srcImage,vUv02);vec4 p10=texture2D(srcImage,vUv10);vec4 p12=texture2D(srcImage,vUv12);vec4 p20=texture2D(srcImage,vUv20);vec4 p21=texture2D(srcImage,vUv21);vec4 p22=texture2D(srcImage,vUv22);int caseCode=0;float dx=0.0,dy=0.0;if(isInObj(p01)){dx+=-1.0;caseCode+=4;}if(isInObj(p21)){dx+=1.0;caseCode+=1;}if(isInObj(p12)){dy+=1.0;caseCode+=2;}if(isInObj(p10)){dy+=-1.0;caseCode+=8;}float pobkg=0.0;if((caseCode>=15)&&(hasSameColor>=1)){pobkg=0.0;}else{ivec3 color=ivec3(color.rgb*255.0);vec3 dist=calX2(color);pobkg=1.0-max(max(dist.r,dist.g),dist.b);}return pobkg;}float diff(vec4 color,vec2 direction){vec2 oneStep=(direction/length(direction))*vec2(1.0/imgWidth,1.0/imgHeight);vec4 inner=texture2D(srcImage,vUv+(oneStep*2.0));if(!isInObj(inner)){oneStep=-oneStep;inner=texture2D(srcImage,vUv+(oneStep*2.0));}if(!isInObj(inner)){return 1.0;}vec4 p;float num=1.0;int stepNum=0;for(int i=0;i<1024;i++){stepNum=i+3;p=texture2D(srcImage,vUv+(vec2(stepNum,stepNum)*oneStep));if(isInObj(p)){num++;inner+=p;}if(i>kernalSize){break;}}inner=inner/num;return length(color.rgb-inner.rgb);}float pOfInner(vec4 color){vec4 p00=texture2D(srcImage,vUv00);vec4 p01=texture2D(srcImage,vUv01);vec4 p02=texture2D(srcImage,vUv02);vec4 p10=texture2D(srcImage,vUv10);vec4 p12=texture2D(srcImage,vUv12);vec4 p20=texture2D(srcImage,vUv20);vec4 p21=texture2D(srcImage,vUv21);vec4 p22=texture2D(srcImage,vUv22);int caseCode=0;float dx=0.0,dy=0.0;if(isInObj(p01)){dx+=-1.0;caseCode+=4;}if(isInObj(p21)){dx+=1.0;caseCode+=1;}if(isInObj(p12)){dy+=1.0;caseCode+=2;}if(isInObj(p10)){dy+=-1.0;caseCode+=8;}float poi=0.0;if(((caseCode==0)||(caseCode==5))||(caseCode==10)){poi=0.0;}else if(caseCode==15){poi=1.0;}else{poi=1.0-diff(color,vec2(dx,dy));}return poi;}void main(){vec4 color=texture2D(srcImage,vUv);if(isInObj(color)){float pb=calPOfBkg(color);if(pb>pOfBkgMax){color=vec4(0.0,0.0,0.0,0.0);}else if((pb>pOfBkgMaxB)&&(pOfInner(color)<0.8)){color=vec4(0.0,0.0,0.0,0.0);}}gl_FragColor=color;}","fs-rgb2CieLab":"#define REF_X 95.047\r\n#define REF_Y 100.000\r\n#define REF_Z 108.883\r\nuniform sampler2D srcImage;varying vec2 vUv;vec3 rgb2XYZ(vec4 rgbColor){if(rgbColor.r>0.04045){rgbColor.r=pow((rgbColor.r+0.055)/1.055,2.4);}else{rgbColor.r=rgbColor.r/12.92;}if(rgbColor.g>0.04045){rgbColor.g=pow((rgbColor.g+0.055)/1.055,2.4);}else{rgbColor.g=rgbColor.g/12.92;}if(rgbColor.b>0.04045){rgbColor.b=pow((rgbColor.b+0.055)/1.055,2.4);}else{rgbColor.b=rgbColor.b/12.92;}rgbColor=rgbColor*100.0;float X=((rgbColor.r*0.4124)+(rgbColor.g*0.3576))+(rgbColor.b*0.1805);float Y=((rgbColor.r*0.2126)+(rgbColor.g*0.7152))+(rgbColor.b*0.0722);float Z=((rgbColor.r*0.0193)+(rgbColor.g*0.1192))+(rgbColor.b*0.9505);return vec3(X,Y,Z);}vec3 rgb2CieLab(vec4 rgbColor){vec3 xyzColor=rgb2XYZ(rgbColor)/vec3(REF_X,REF_Y,REF_Z);if(xyzColor.x>0.008856){xyzColor.x=pow(xyzColor.x,1.0/3.0);}else{xyzColor.x=(7.787*xyzColor.x)+(16.0/116.0);}if(xyzColor.y>0.008856){xyzColor.y=pow(xyzColor.y,1.0/3.0);}else{xyzColor.y=(7.787*xyzColor.y)+(16.0/116.0);}if(xyzColor.z>0.008856){xyzColor.z=pow(xyzColor.z,1.0/3.0);}else{xyzColor.z=(7.787*xyzColor.z)+(16.0/116.0);}float CIE_L=(116.0*xyzColor.y)-16.0;float CIE_a=500.0*(xyzColor.x-xyzColor.y);float CIE_b=200.0*(xyzColor.y-xyzColor.z);CIE_L=(CIE_L/100.0)*255.0;CIE_a=CIE_a+128.0;CIE_b=CIE_b+128.0;return vec3(CIE_L,CIE_a,CIE_b);}void main(){vec4 rgbColor=texture2D(srcImage,vUv);vec3 cieLab=rgb2CieLab(rgbColor);gl_FragColor=vec4(cieLab.xyz/255.0,rgbColor.a);}","fs-subtract":"uniform sampler2D srcImage;uniform sampler2D bkgImage;varying vec2 vUv;void main(){vec4 srcColor=texture2D(srcImage,vUv),bkgColor=texture2D(bkgImage,vUv);gl_FragColor=srcColor-bkgColor;gl_FragColor.a=srcImage.a;}","fs-threshold":"uniform sampler2D srcImage;uniform float threshold;varying vec2 vUv;vec4 thresholdDenoise(){vec4 color=texture2D(srcImage,vUv);if(length(color.rgb)<threshold){color.rgb=vec3(0.0,0.0,0.0);}return color;}void main(){gl_FragColor=thresholdDenoise();}","vs-original":"uniform float imgWidth;uniform float imgHeight;uniform float uSampleLength;uniform float thita;varying vec2 vUv00;varying vec2 vUv01;varying vec2 vUv02;varying vec2 vUv10;varying vec2 vUv;varying vec2 vUv12;varying vec2 vUv20;varying vec2 vUv21;varying vec2 vUv22;void main(){float DX=uSampleLength/imgWidth;float DY=uSampleLength/imgHeight;float ss=sin(thita);float cs=cos(thita);float ss0=sin(thita+(3.14159265/2.0));float cs0=cos(thita+(3.14159265/2.0));float dx=(DX*cs)-(DY*ss);float dy=(DX*ss)+(DY*cs);float dx0=(DX*cs0)-(DY*ss0);float dy0=(DX*ss0)+(DY*cs0);vUv10=uv+vec2(dx0,dy0);vUv=uv;vUv12=uv-vec2(dx0,dy0);vUv00=vUv10-vec2(dx,dy);vUv20=vUv10+vec2(dx,dy);vUv02=vUv12-vec2(dx,dy);vUv22=vUv12+vec2(dx,dy);vUv01=vUv-vec2(dx,dy);vUv21=vUv+vec2(dx,dy);gl_Position=(projectionMatrix*modelViewMatrix)*vec4(position,1.0);}"};
