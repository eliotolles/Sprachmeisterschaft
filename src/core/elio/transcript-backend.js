// Adapted from ElioEinfachlernen- bd517910 worker/transcript-backend.mjs.
// Server-side only. Times are seconds, matching Elio's existing listening queue.
export async function fetchElioTranscript(env, id, languages = ['de']) {
  const fail=(code,reason,retryable=false)=>({available:false,code,reason,retryable,allowAiFallback:false,cues:[]});
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return fail('INVALID_VIDEO_ID','Mã video không hợp lệ.');
  if (!env.TRANSCRIPT_NATIVE_FETCH && (!env.TRANSCRIPT_BACKEND_URL || !env.TRANSCRIPT_BACKEND_TOKEN)) {
    try {
      const res = await fetch(`https://api.freetranscriptapi.com/v1/transcript?video_url=${id}&lang=${languages[0] || 'de'}`, {
        signal: AbortSignal.timeout(30000)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.transcript) && data.transcript.length > 0) {
          const cues = data.transcript
            .filter(c => typeof c?.text === 'string' && c.text.trim())
            .map(c => ({
              start: Math.round(Number(c.start) * 1000) / 1000,
              end: Math.round((Number(c.start) + (Number(c.duration) || 2)) * 1000) / 1000,
              text: c.text.trim()
            }))
            .sort((a, b) => a.start - b.start);
          return { available: true, videoId: id, language: data.language || 'de', source: 'youtube', cues };
        }
      }
    } catch {}
    return fail('CAPTIONS_NOT_CONFIGURED', 'Chưa cấu hình backend phụ đề hoặc chưa lấy được phụ đề tự động.');
  }
  try {
    const base=new URL(env.TRANSCRIPT_BACKEND_URL||'https://native.invalid');
    if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.pathname!=='/')
      return fail('CAPTIONS_NOT_CONFIGURED','TRANSCRIPT_BACKEND_URL phải là HTTPS origin, không có đường dẫn.');
    const options={
      method:'POST', redirect:'manual',signal:AbortSignal.timeout(60000),
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.TRANSCRIPT_BACKEND_TOKEN},
      body:JSON.stringify({id,languages,engine:'auto'})
    };
    const response=env.TRANSCRIPT_NATIVE_FETCH?await env.TRANSCRIPT_NATIVE_FETCH(options.body):await fetch(new URL('/v1/transcript',base),options);
    if(response.status===401||response.status===403)return fail('CAPTIONS_BACKEND_AUTH','Backend từ chối khóa truy cập.');
    if(response.status===429)return fail('CAPTIONS_RATE_LIMIT','Backend đang giới hạn yêu cầu. Hãy thử lại sau.',true);
    if(response.status>=300&&response.status<400)return fail('CAPTIONS_BACKEND_REDIRECT','Backend yêu cầu chuyển hướng. Hãy cấu hình URL HTTPS trực tiếp.');
    if(!response.ok)return fail('CAPTIONS_BACKEND_ERROR','Backend phụ đề chưa sẵn sàng (HTTP '+response.status+').',true);
    const raw=await response.text();if(raw.length>3000000)return fail('CAPTIONS_TOO_LARGE','Dữ liệu phụ đề quá lớn.');
    const data=JSON.parse(raw);
    if(!data.available)return fail('CAPTIONS_UNAVAILABLE','Chưa lấy được phụ đề.',!!data.retryable);
    // Do not accept the wrong video, translated language, milliseconds, or partial data.
    if(data.videoId!==id||data.timeUnit!=='seconds'||!languages.some(lang=>data.language===lang||data.language?.startsWith(lang+'-')))
      return fail('CAPTIONS_DATA_MISMATCH','Backend trả sai video, ngôn ngữ hoặc đơn vị thời gian.');
    if(!Array.isArray(data.cues)||!data.cues.length||data.cues.length>10000||!data.cues.every((c,i,a)=>
      typeof c.text==='string'&&c.text.trim()&&c.text.length<=1500&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start&&(!i||c.start>=a[i-1].start)))
      return fail('CAPTIONS_INVALID_DATA','Backend trả phụ đề không hợp lệ; chưa lưu dữ liệu.');
    return {available:true,videoId:id,language:data.language,source:data.source==='youtube-auto'?'youtube-auto':'youtube',
      cached:!!data.cached,cues:data.cues};
  }catch(e){return fail(e?.name==='TimeoutError'||e?.name==='AbortError'?'CAPTIONS_TIMEOUT':'CAPTIONS_BACKEND_ERROR','Chưa kết nối được backend phụ đề hoặc hết thời gian chờ.',true);}
}

export function transcriptBackendStatus(env) {
 if(env.TRANSCRIPT_NATIVE_FETCH)return {configured:!!env.AI_ENCRYPTION_KEY,urlConfigured:true,tokenConfigured:!!env.AI_ENCRYPTION_KEY,mode:'vercel-python'};
 const urlConfigured=!!env.TRANSCRIPT_BACKEND_URL,tokenConfigured=!!env.TRANSCRIPT_BACKEND_TOKEN;
 return {configured:urlConfigured&&tokenConfigured,urlConfigured,tokenConfigured,mode:urlConfigured||tokenConfigured?'python':'legacy'};
}
export async function checkTranscriptBackend(env) {
 const status=transcriptBackendStatus(env);
 if(!status.configured)return {...status,healthy:false,reason:'Chưa cấu hình đủ địa chỉ backend và khóa truy cập.'};
 try{
  if(env.TRANSCRIPT_NATIVE_HEALTH){const response=await env.TRANSCRIPT_NATIVE_HEALTH();const data=await response.json();const healthy=response.ok&&data.ok===true&&data.service==='elio-transcript';return {...status,healthy,reason:healthy?'Python trên Vercel đang hoạt động. Thử video bên dưới để kiểm tra lấy phụ đề thật.':'Python trên Vercel chưa phản hồi đúng. Kiểm tra bản triển khai.'};}
  const url=new URL(env.TRANSCRIPT_BACKEND_URL);
  if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)return {...status,healthy:false,reason:'Địa chỉ backend cần là HTTPS origin.'};
  const response=await fetch(new URL('/health',url),{redirect:'manual',signal:AbortSignal.timeout(10000)});
  if(!response.ok)return {...status,healthy:false,reason:'Backend chưa phản hồi health thành công (HTTP '+response.status+').'};
  const data=await response.json(),healthy=data.ok===true&&data.service==='elio-transcript';
  return {...status,healthy,reason:healthy?'Backend đang hoạt động. Hãy thử video để kiểm tra cả khóa và nguồn phụ đề.':'Địa chỉ không trả trạng thái của Elio Transcript.'};
 }catch{return {...status,healthy:false,reason:'Chưa kết nối được backend hoặc hết thời gian chờ.'};}
}

