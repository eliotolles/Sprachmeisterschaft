const fail=message=>Error(message);
export function speechBlob({mimeType,data}){
 if(typeof mimeType!=='string'||typeof data!=='string'||!data||data.length>10000000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw fail('Âm thanh server không hợp lệ.');
 let bytes;try{bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));}catch{throw fail('Âm thanh server không hợp lệ.');}
 const type=mimeType.toLowerCase();
 if(type.startsWith('audio/l16')){
  const rate=Number(type.match(/(?:^|;)\s*rate=(\d+)/)?.[1]||24000);
  if(!Number.isInteger(rate)||rate<8000||rate>48000||bytes.length%2)throw fail('Dữ liệu PCM chưa hợp lệ.');
  const header=new ArrayBuffer(44),v=new DataView(header),str=(at,s)=>[...s].forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));
  str(0,'RIFF');v.setUint32(4,36+bytes.length,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,bytes.length,true);
  return new Blob([header,bytes],{type:'audio/wav'});
 }
 if(!/^audio\/(wav|x-wav|mpeg|mp3|ogg|webm|mp4)(?:;|$)/.test(type))throw fail('Định dạng giọng đọc chưa được hỗ trợ.');
 return new Blob([bytes],{type:mimeType});
}
export function createSpeechPlayer({client,makeAudio=url=>new Audio(url),urls=URL}){
 let generation=0,audio=null,url=null,settle=null;
 function stop(){generation++;audio?.pause();if(audio){audio.onended=null;audio.onerror=null;}audio=null;if(url)urls.revokeObjectURL(url);url=null;settle?.();settle=null;}
 async function play(text){stop();const current=generation,owner=client.getUser()?.id;if(!owner)throw fail('Bạn cần đăng nhập.');const result=await client.speakGerman({text});if(current!==generation||owner!==client.getUser()?.id)throw Object.assign(fail('Phiên âm thanh đã thay đổi.'),{code:'ACCOUNT_CHANGED'});url=urls.createObjectURL(speechBlob(result));audio=makeAudio(url);
  return new Promise((resolve,reject)=>{settle=resolve;const finish=e=>{if(current!==generation)return;settle=null;stop();if(e)reject(fail('Trình duyệt chưa phát được âm thanh.'));else resolve();};audio.onended=()=>finish();audio.onerror=()=>finish(true);Promise.resolve(audio.play()).catch(()=>finish(true));});
 }
 return {play,stop};
}
export function createGermanRecorder({client,media=()=>navigator.mediaDevices,Recorder=globalThis.MediaRecorder,timers=globalThis}){
 let generation=0,recorder=null,stream=null,timer=null;
 function release(){if(timer)timers.clearTimeout(timer);timer=null;stream?.getTracks().forEach(t=>t.stop());stream=null;}
 function cancel(){generation++;if(recorder&&recorder.state!=='inactive')recorder.stop();recorder=null;release();}
 function stop(){if(recorder&&recorder.state!=='inactive')recorder.stop();}
 async function start({onText,onState,onError}){
  cancel();const current=generation,owner=client.getUser()?.id;if(!owner||!Recorder||!media()?.getUserMedia)throw fail('Trình duyệt chưa hỗ trợ ghi âm hoặc chưa đăng nhập.');
  const captured=()=>current===generation&&owner===client.getUser()?.id;
  const acquired=await media().getUserMedia({audio:true});if(!captured()){acquired.getTracks().forEach(t=>t.stop());return;}
  stream=acquired;const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(t=>Recorder.isTypeSupported(t));if(!mime){release();throw fail('Không có định dạng ghi âm tương thích.');}
  const chunks=[];let size=0,oversized=false;const r=new Recorder(stream,{mimeType:mime});recorder=r;
  r.ondataavailable=e=>{if(e.data?.size){size+=e.data.size;if(size>5000000){oversized=true;stop();}else chunks.push(e.data);}};
  r.onerror=()=>{if(captured()){cancel();onState('idle');onError(fail('Không ghi được âm thanh.'));}};
  r.onstop=async()=>{if(!captured()){acquired.getTracks().forEach(t=>t.stop());return;}release();recorder=null;onState('transcribing');try{if(oversized||!size)throw fail(oversized?'Âm thanh vượt 5 MB; hãy ghi đoạn ngắn hơn.':'Chưa có âm thanh để nhận dạng.');const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());if(!captured())return;let binary='';for(let i=0;i<bytes.length;i+=16000)binary+=String.fromCharCode(...bytes.subarray(i,i+16000));const result=await client.transcribeGerman({mimeType:mime.split(';')[0],data:btoa(binary)});if(captured()){if(result.language!=='de'||typeof result.text!=='string'||!result.text.trim())throw fail('Server chưa nhận dạng được lời tiếng Đức.');onText(result.text);}}catch(e){if(captured())onError(e);}finally{if(captured())onState('idle');}};
  try{r.start(1000);timer=timers.setTimeout(stop,60000);onState('recording');}catch(e){cancel();throw e;}
 }
 return {start,stop,cancel};
}
