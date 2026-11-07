import React, {useEffect, useRef, useState} from 'react';
import {SpeakButton} from '@/components/ui/SpeakButton';
export function ParticipleDictionary() {
 const [word,setWord]=useState(''),[result,setResult]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const current=useRef(null);
 useEffect(()=>()=>current.current?.abort(),[]);
 async function lookup(event){
  event.preventDefault(); current.current?.abort(); const controller=new AbortController(); current.current=controller;
  setBusy(true);setError('');setResult(null);const timer=setTimeout(()=>controller.abort(),16000);
  try {const response=await fetch('/api/dictionary/participle?'+new URLSearchParams({word}),{signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'Không tra được từ.');if(current.current===controller)setResult(data);}
  catch(e){if(current.current===controller)setError(e.name==='AbortError'?'Tra từ quá thời gian chờ. Hãy thử lại.':e.message);}
  finally{clearTimeout(timer);if(current.current===controller)setBusy(false);}
 }
 return <section className="surface border border-border p-5 space-y-4 font-body">
  <h2 className="font-heading text-xl font-semibold">Từ điển động từ → Partizip II</h2>
  <p className="text-muted-foreground">Nhập động từ nguyên mẫu, kể cả động từ tách hoặc phản thân. Tra trực tiếp Wiktionary tiếng Đức; không giới hạn ở các ví dụ trong bài.</p>
  <form onSubmit={lookup} className="flex flex-wrap gap-2"><label htmlFor="participle-word" className="sr-only">Động từ tiếng Đức</label><input id="participle-word" value={word} maxLength={90} onChange={e=>setWord(e.target.value)} placeholder="gehen, einkaufen, sich erinnern…" required className="flex-1 min-w-0 border border-border bg-background px-3 py-2 rounded-sm font-body"/><button disabled={busy||!word.trim()} className="tap px-4 py-2 bg-accent text-accent-foreground rounded-sm font-heading disabled:opacity-50">{busy?'Đang tra…':'Tra Partizip II'}</button></form>
  <div aria-live="polite" aria-busy={busy}>{error&&<p role="alert">{error}</p>}{result&&<div className="space-y-4">{result.message&&<p>{result.message}</p>}{result.entries.map((entry,index)=><article key={index} className="border-t border-border pt-3 space-y-2"><div className="flex items-start justify-between gap-2"><p lang="de" className="font-heading text-xl font-semibold">{entry.infinitive} → {entry.participles.join(' / ')}</p><SpeakButton text={entry.infinitive+', '+entry.participles.join(', ')} size="sm"/></div><p>Präteritum (ich): <strong>{entry.past.join(' / ')||'Nguồn chưa cung cấp'}</strong></p><p>Trợ động từ: <strong>{entry.auxiliaries.join(' / ')||'Nguồn chưa cung cấp'}</strong></p></article>)}<p className="text-sm text-muted-foreground">{result.entries.length>1?'Có nhiều bảng chia: chọn theo nghĩa và cách dùng trong nguồn. ':''}Trợ động từ có thể thay đổi theo nghĩa và ngữ cảnh.</p><a href={result.source} target="_blank" rel="noreferrer" className="text-sm text-accent underline">Nguồn: Wiktionary · {result.license} · Xem nghĩa và lịch sử sửa đổi</a></div>}</div>
 </section>;
}
