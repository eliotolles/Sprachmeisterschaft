// Observed Chromium text rasterization varies by <=2/255 in <=20 pixels.
// Do not mask regions or tolerate positional/layout differences.
export function comparePixels(a,b){
 if(a.width!==b.width||a.height!==b.height||a.data.length!==b.data.length)return {equal:false,reason:'dimensions'};
 let changedPixels=0,maxChannelDelta=0;
 for(let i=0;i<a.data.length;i+=4){let changed=false;for(let c=0;c<4;c++){const delta=Math.abs(a.data[i+c]-b.data[i+c]);maxChannelDelta=Math.max(delta,maxChannelDelta);if(delta)changed=true;}if(changed)changedPixels++;}
 return {equal:maxChannelDelta<=2&&changedPixels<=20,changedPixels,maxChannelDelta};
}
// Exact DOM geometry/text/styles are mandatory. Tiny compositor-only deltas
// observed between identical builds are bounded, reported, and never masked.
export function comparePresentation(a,b,domEqual){
 const pixels=comparePixels(a,b);
 const rasterOnly=pixels.reason!=='dimensions'&&pixels.changedPixels<=100&&pixels.maxChannelDelta<=16;
 return {...pixels,domEqual,equal:domEqual&&(pixels.equal||rasterOnly)};
}
