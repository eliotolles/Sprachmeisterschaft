import React,{useEffect,useState} from 'react';
import {toast} from 'sonner';
import {elioClient} from '@/lib/elio-auth-runtime';
import {useRouter} from '@/lib/router';
import {createGermanRecorder} from '@/core/elio/browser-audio';
import {speechMatchScore} from '@/lib/algorithms';
import {LookupText} from '@/components/vocabulary/WordDetail';
import {SpeakButton} from '@/components/ui/SpeakButton';
import {PageHeader} from '@/components/ui/PageHeader';

function useCollectionContents(id){
 const [state,setState]=useState({loading:true,items:[],collection:null,error:''});
 useEffect(()=>{
  let generation=0,alive=true;
  const load=async()=>{
   const stamp=++generation,owner=elioClient.getUser()?.id;
   setState({loading:true,items:[],collection:null,error:''});
   try{const result=await elioClient.collectionContents(id);if(alive&&stamp===generation&&owner===elioClient.getUser()?.id)setState({loading:false,...result,error:''});}
   catch(error){if(alive&&stamp===generation)setState({loading:false,items:[],collection:null,error:error.message});}
  };
  load();window.addEventListener('sprach_auth_change',load);
  return()=>{alive=false;generation++;window.removeEventListener('sprach_auth_change',load);};
 },[id]);
 return state;
}
const button='tap px-3 py-2 rounded-sm border border-border bg-card font-heading text-sm disabled:opacity-50';

export function CollectionReadingStudio({collectionId}){
 const {navigate}=useRouter(),state=useCollectionContents(collectionId);
 const [selected,setSelected]=useState(null);
 const readable=state.items.filter(row=>['reading','exam'].includes(row.kind));
 const record=readable.find(row=>row.id===selected);
 let data=null;if(record)try{data=JSON.parse(record.data);}catch{}
 return <div className="space-y-5 font-body">
  <PageHeader eyebrow="ĐỌC TRONG BỘ" title={state.collection?.name||'Bài đọc của bộ'} subtitle="Đọc văn bản gốc, tra từ trong ngữ cảnh và mở đề thi để làm bài."/>
  {state.loading&&<p>Đang tải bài đọc…</p>}
  {state.error&&<p role="alert">{state.error}</p>}
  {!state.loading&&!state.error&&!readable.length&&<p>Chưa có bài đọc trong bộ. Import văn bản đọc hoặc đề thi có phần Lesen.</p>}
  <div className="space-y-3">{readable.map(row=><button key={row.id} onClick={()=>row.kind==='exam'?navigate('/exams/'+encodeURIComponent(row.id)+'?collection='+collectionId):setSelected(row.id)} className={'surface w-full border border-border p-4 text-left font-heading '+(selected===row.id?'text-accent':'')}>{row.title} · {row.level} {row.kind==='exam'?'· Mở đề thi':''}</button>)}</div>
  {data&&<article className="surface border border-border p-5 space-y-4">{(data.items||[data]).map((item,index)=><section key={item.id||index} className="space-y-3"><h2 className="font-heading text-xl">{item.title||record.title}</h2><div className="leading-relaxed whitespace-pre-wrap"><LookupText text={item.content||item.text||''}/></div><SpeakButton text={item.content||item.text||''}/></section>)}</article>}
 </div>;
}
export function CollectionSpeechStudio({collectionId,pronunciation=false}){
 const state=useCollectionContents(collectionId);
 const [recorder]=useState(()=>createGermanRecorder({client:elioClient}));
 const [index,setIndex]=useState(0),[transcript,setTranscript]=useState(''),[recording,setRecording]=useState('idle');
 useEffect(()=>()=>recorder.cancel(),[recorder]);
 const phrases=[];
 for(const record of state.items){
  let data;try{data=JSON.parse(record.data);}catch{continue;}
  for(const item of data.words||data.items||[data]){
   if(record.kind==='vocab'){const text=[item.article,item.de||item.german].filter(Boolean).join(' ');if(text)phrases.push({text,vi:item.vi||item.vietnamese||''});}
   else if(record.kind==='speaking'){if(item.content)for(const text of item.content.split(/(?<=[.!?])\s+/u))if(text.trim())phrases.push({text:text.trim(),vi:''});}
   else if(record.kind==='listening')for(const cue of item.cues||[])if(cue.text)phrases.push({text:cue.text,vi:cue.vi||''});
  }
 }
 const current=phrases[index]||phrases[0];
 const move=delta=>{recorder.cancel();setRecording('idle');setTranscript('');setIndex(value=>Math.max(0,Math.min(phrases.length-1,value+delta)));};
 return <div className="space-y-5 font-body">
  <PageHeader eyebrow={pronunciation?'PHÁT ÂM TRONG BỘ':'NÓI THEO TRONG BỘ'} title={state.collection?.name||'Luyện nói từ bộ học'} subtitle="Nghe mẫu, ghi âm và đối chiếu lời chép được nhận dạng từ âm thanh thật."/>
  {state.loading&&<p>Đang tải nội dung…</p>}
  {state.error&&<p role="alert">{state.error}</p>}
  {!state.loading&&!state.error&&!current&&<p>Bộ chưa có từ hoặc câu để luyện. Import từ vựng, văn bản nói hoặc video có phụ đề vào bộ.</p>}
  {current&&<section className="surface border border-border p-6 space-y-4">
   <p className="text-sm text-muted-foreground">{index+1} / {phrases.length}</p><h2 lang="de" className="font-heading text-2xl font-semibold">{current.text}</h2>{current.vi&&<p>{current.vi}</p>}<SpeakButton text={current.text}/>
   <div className="flex flex-wrap gap-2"><button className={button} disabled={index===0} onClick={()=>move(-1)}>Trước</button><button className={button} disabled={recording==='transcribing'} onClick={async()=>{
    if(recording==='recording'){recorder.stop();return;}
    setTranscript('');
    try{await recorder.start({onText:setTranscript,onState:setRecording,onError:error=>toast.error(error.message)});}catch(error){toast.error(error.message);}
   }}>{recording==='recording'?'Dừng ghi âm':recording==='transcribing'?'Đang nhận dạng…':'Ghi âm câu của tôi'}</button><button className={button} disabled={index>=phrases.length-1} onClick={()=>move(1)}>Tiếp</button></div>
   {transcript&&<div role="status" className="border-t border-border pt-4 space-y-2"><p>Lời được nhận dạng</p><p lang="de" className="font-heading">{transcript}</p><p>Độ khớp bản chép {speechMatchScore(current.text,transcript)}%</p><p className="text-sm text-muted-foreground">Đối chiếu văn bản không đánh giá đầy đủ trọng âm, ngữ điệu hoặc chất lượng từng âm.</p></div>}
  </section>}
 </div>;
}
