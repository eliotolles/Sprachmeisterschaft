import {ParticipleDictionary} from '@/components/common/ParticipleDictionary';
import React,{useState} from 'react';
import {ArrowRight,CheckCircle2} from 'lucide-react';
import {EXPLORE_LESSONS} from '@/data/explore-lessons';
import {PageHeader} from '@/components/ui/PageHeader';
import {SpeakButton} from '@/components/ui/SpeakButton';
import {useRouter} from '@/lib/router';

function QuickCheck({quiz}){
 const [answer,setAnswer]=useState(null),[checked,setChecked]=useState(false);
 return <section className="surface border border-border p-5 space-y-3 font-body"><h2 className="font-heading text-xl font-semibold">Tự kiểm tra</h2><p>{quiz.question}</p><div className="space-y-2">{quiz.options.map((option,index)=><label key={index} className="flex items-start gap-2"><input type="radio" name="explore-answer" checked={answer===index} onChange={()=>{setAnswer(index);setChecked(false);}}/><span>{option}</span></label>)}</div><button disabled={answer===null} onClick={()=>setChecked(true)} className="tap px-4 py-2 rounded-sm bg-accent text-accent-foreground font-heading disabled:opacity-50">Kiểm tra</button>{checked&&<p role="status" className="border-t border-border pt-3"><CheckCircle2 className="inline w-4 h-4 mr-1"/>{answer===quiz.answer?'Đúng. ':'Chưa đúng. '}{quiz.explanation}</p>}</section>;
}
export function ExplorePage({topic='sentence'}){
 const {navigate}=useRouter();
 const lesson=EXPLORE_LESSONS.find(item=>item.id===topic)||EXPLORE_LESSONS[0];
 return <div className="space-y-6 font-body">
  <PageHeader eyebrow="HỌC & KHÁM PHÁ" title="Tiếng Đức trong cách dùng hằng ngày" subtitle="Quy tắc, ví dụ Đức–Việt và bài luyện ngắn để hiểu rồi tự dùng."/>
  <nav aria-label="Chủ điểm học và khám phá" className="flex flex-wrap gap-2">{EXPLORE_LESSONS.map(item=><button key={item.id} onClick={()=>navigate('/explore/'+item.id)} aria-current={item.id===lesson.id?'page':undefined} className={'tap px-3 py-2 rounded-sm border font-heading text-sm '+(item.id===lesson.id?'bg-accent text-accent-foreground border-accent':'bg-card border-border text-foreground hover:bg-muted')}>{item.title}</button>)}</nav>
  <section className="space-y-2"><h1 className="font-heading text-2xl font-bold">{lesson.title}</h1><p className="text-muted-foreground leading-relaxed">{lesson.intro}</p></section>
  {lesson.id==='participle'&&<ParticipleDictionary/>}
  {lesson.route?<button className="tap px-4 py-2 bg-accent text-accent-foreground rounded-sm font-heading" onClick={()=>navigate(lesson.route)}>{lesson.action}<ArrowRight className="inline w-4 h-4 ml-2"/></button>:<>
   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{lesson.cards.map(card=><article key={card.title} className="surface border border-border p-5 space-y-3"><h2 className="font-heading text-xl font-semibold">{card.title}</h2><p className="leading-relaxed">{card.rule}</p><div className="space-y-3">{card.examples.map(([de,vi])=><div key={de} className="border-l-2 border-accent/50 pl-3"><div className="flex items-start justify-between gap-3"><p lang="de" className="font-heading font-semibold">{de}</p><SpeakButton text={de.replace(/\[[^\]]+\]/g,'')} size="sm"/></div><p className="mt-1 text-sm text-muted-foreground">{vi}</p></div>)}</div>{card.note&&<p className="text-sm leading-relaxed border-t border-border pt-3">{card.note}</p>}</article>)}</div>
   <QuickCheck key={lesson.id} quiz={lesson.quiz}/>
   <footer className="text-sm text-muted-foreground space-y-2"><p className="font-heading">Nguồn tham khảo</p>{lesson.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block text-accent underline">{source.title}</a>)}</footer>
  </>}
 </div>;
}
