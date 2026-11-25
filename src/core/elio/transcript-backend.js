// Adapted from ElioEinfachlernen- bd517910 worker/transcript-backend.mjs.
// Server-side only. Times are seconds, matching Elio's existing listening queue.
//
// Fetch order:
// 1. Python transcript backend (TRANSCRIPT_BACKEND_URL/TOKEN or
//    TRANSCRIPT_NATIVE_FETCH) when configured.
// 2. FreeTranscriptAPI, retried, with a strict language check: only the
//    requested language is accepted. The service ignores `lang` when the video
//    has no track in that language and returns another language instead —
//    that must NOT be served as German.
// YouTube itself blocks server-side access (watch page, timedtext and the
// youtubei player API all answer LOGIN_REQUIRED from datacenter IPs), so there
// is no direct YouTube fallback. FreeTranscriptAPI is the only public source
// that works from a Worker.

const LANGUAGE_NAMES = { de: 'Đức', en: 'Anh', fr: 'Pháp', es: 'Tây Ban Nha', it: 'Ý', pt: 'Bồ Đào Nha', ja: 'Nhật', ko: 'Hàn', vi: 'Việt', zh: 'Trung' };
function languageName(code) {
  const base = String(code || '').toLowerCase().split('-')[0];
  return LANGUAGE_NAMES[base] || base || 'khác';
}
function sameLanguage(a, b) {
  const x = String(a || '').toLowerCase(), y = String(b || '').toLowerCase();
  return !!x && !!y && (x === y || x.startsWith(y + '-') || y.startsWith(x + '-'));
}
function parseFreeTranscript(data, wanted) {
  if (!Array.isArray(data?.transcript) || !data.transcript.length) return null;
  const lang = String(data.language || '').toLowerCase();
  if (lang && !sameLanguage(lang, wanted)) return { wrongLanguage: lang };
  const cues = data.transcript
    .filter(c => typeof c?.text === 'string' && c.text.trim())
    .map(c => ({
      start: Math.round(Number(c.start) * 1000) / 1000,
      end: Math.round((Number(c.start) + (Number(c.duration) || 2)) * 1000) / 1000,
      text: c.text.trim()
    }))
    .sort((a, b) => a.start - b.start);
  return cues.length ? { cues, language: lang || wanted } : null;
}
async function fetchFreeTranscript(id, languages) {
  const wanted = languages[0] || 'de';
  const url = `https://api.freetranscriptapi.com/v1/transcript?video_url=${id}&lang=${wanted}`;
  let sawRateLimit = false;
  let serverErrors = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
    let res;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    } catch {
      continue; // network error / timeout -> retry
    }
    if (res.status === 429) { sawRateLimit = true; continue; }
    if (res.status >= 500) {
      serverErrors++;
      if (serverErrors < 2) continue; // one retry for a possibly transient 500
      return { status: 'not-configured' }; // service keeps erroring for this video
    }
    if (!res.ok) return { status: 'not-configured' }; // definitive: no transcript for this video
    let data;
    try { data = await res.json(); } catch { continue; }
    const parsed = parseFreeTranscript(data, wanted);
    if (!parsed) return { status: 'not-configured' };
    if (parsed.wrongLanguage) return { status: 'wrong-language', language: parsed.wrongLanguage };
    return { status: 'ok', cues: parsed.cues, language: parsed.language };
  }
  return { status: sawRateLimit ? 'rate-limit' : 'timeout' };
}
export async function fetchElioTranscript(env, id, languages = ['de']) {
  const fail=(code,reason,retryable=false)=>({available:false,code,reason,retryable,allowAiFallback:false,cues:[]});
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return fail('INVALID_VIDEO_ID','Mã video không hợp lệ.');
  if (!env.TRANSCRIPT_NATIVE_FETCH && (!env.TRANSCRIPT_BACKEND_URL || !env.TRANSCRIPT_BACKEND_TOKEN)) {
    const free = await fetchFreeTranscript(id, languages);
    if (free.status === 'ok') return { available: true, videoId: id, language: free.language, source: 'youtube', cues: free.cues };
    if (free.status === 'wrong-language') return fail('CAPTIONS_WRONG_LANGUAGE', `Video này không có phụ đề tiếng ${languageName(languages[0])} (chỉ có phụ đề tiếng ${languageName(free.language)}).`);
    if (free.status === 'rate-limit') return fail('CAPTIONS_RATE_LIMIT', 'Dịch vụ lấy lời đang giới hạn yêu cầu. Hãy thử lại sau ít phút.', true);
    if (free.status === 'timeout') return fail('CAPTIONS_TIMEOUT', 'Dịch vụ lấy lời chưa phản hồi kịp. Hãy thử lại.', true);
    return fail('CAPTIONS_NOT_CONFIGURED', 'Chưa lấy được phụ đề tiếng Đức tự động cho video này.');
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

