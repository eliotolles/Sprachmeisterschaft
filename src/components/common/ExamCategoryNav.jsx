import React from 'react';
import {useRouter} from '@/lib/router';
import {EXAM_CATEGORIES,examCategory} from '@/lib/exam-categories';
export function useExamCategory(fallback='general'){
 const {currentPath,search,navigate}=useRouter();const params=new URLSearchParams(search);
 return [examCategory(params.get('exam'))||fallback,value=>{params.set('exam',value);params.delete('level');navigate(currentPath+'?'+params.toString());}];
}
export function ExamCategoryNav({value,onChange}){
 return <nav aria-label="Kỳ thi" className="flex flex-wrap gap-2">{EXAM_CATEGORIES.map(([id,label])=><button key={id} type="button" aria-pressed={value===id} onClick={()=>onChange(id)} className={'tap px-3 py-2 rounded-sm border font-heading text-sm '+(value===id?'border-accent bg-accent text-accent-foreground':'border-border bg-card text-foreground')}>{label}</button>)}</nav>;
}
