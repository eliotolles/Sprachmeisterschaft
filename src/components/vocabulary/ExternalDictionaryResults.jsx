import React,{useEffect,useState} from 'react';
import {SpeakButton} from '@/components/ui/SpeakButton';
export function ExternalDictionaryResults({query}){
 const [state,setState]=useState({});
 useEffect(()=>{
  const term=query.trim();if(term.length<2){setState({});return;}
  const controller=new AbortController();let deadline,active=true;
  setState({busy:true});
  const delay=setTimeout(async()=>{
   deadline=setTimeout(()=>controller.abort(),16000);
   try{const response=await fetch('/api/dictionary/lookup?'+new URLSearchParams({word:term}),{signal:controller.signal});const result=await response.json();if(!response.ok)throw Error(result.error||'Không tra được từ.');if(!controller.signal.aborted)setState({result});}
   catch(error){if(!active)return;if(!controller.signal.aborted)setState({error:error.message});else setState({error:'Kho từ điển phản hồi quá lâu. Hãy thử lại.'});}
   finally{clearTimeout(deadline);}
  },600);
  return()=>{active=false;clearTimeout(delay);clearTimeout(deadline);controller.abort();};
 },[query]);
 if(query.trim().length<2)return <p className="text-sm text-muted-foreground font-body">Nhập ít nhất 2 ký tự để tra thêm kho Wiktionary Đức–Việt và tiếng Đức.</p>;
 return <section className="surface border border-border p-4 space-y-4 font-body" aria-live="polite" aria-busy={!!state.busy}>
  <h2 className="font-heading text-lg font-semibold">Kết quả từ kho từ điển</h2>
  {state.busy&&<p>Đang tra Wiktionary…</p>}{state.error&&<p role="alert">{state.error}</p>}
  {state.result&&<>{!state.result.entries.length&&<p>Chưa tìm thấy mục từ phù hợp trong nguồn. Thử dạng nguyên mẫu hoặc viết hoa danh từ.</p>}{state.result.partial&&<p>Một nguồn đang gián đoạn; đang hiển thị nguồn còn truy cập được.</p>}{state.result.entries.map(entry=><article key={entry.language} className="border-t border-border pt-3 space-y-2">
   <div className="flex items-center gap-2"><h3 lang="de" className="font-heading text-xl font-semibold">{entry.title}</h3><SpeakButton text={entry.title} size="sm"/></div>
   <p className="text-sm text-muted-foreground">{entry.language==='vi'?'Nghĩa tiếng Việt':'Giải thích tiếng Đức · nguồn này chưa cung cấp nghĩa tiếng Việt'}{entry.ipa.length?' · '+entry.ipa.join(' / '):''}</p>
   <ul className="list-disc pl-5 space-y-1">{entry.definitions.map((text,index)=><li key={index} lang={entry.language}>{text}</li>)}</ul>
   {entry.verbs.map((verb,index)=><p key={index} lang="de" className="font-heading">{verb.infinitive} → {verb.past.join(' / ')} → <strong>{verb.participles.join(' / ')}</strong> · {verb.auxiliaries.join(' / ')}</p>)}
   <a href={entry.source} target="_blank" rel="noreferrer" className="text-sm text-accent underline">Wiktionary · {state.result.license} · Xem toàn bộ nghĩa, ví dụ và lịch sử</a>
  </article>)}<p className="text-xs text-muted-foreground">Bộ lọc A1–C2 áp dụng cho dữ liệu trong app; nguồn ngoài không tự gán cấp độ. Chưa có nghĩa Việt sẽ hiển thị giải thích Đức từ nguồn.</p></>}
 </section>;
}
