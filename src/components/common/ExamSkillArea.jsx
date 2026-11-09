import {InterviewStudio} from '@/components/skills/InterviewStudio';
import {useRouter} from '@/lib/router';
import React from 'react';
import {ExamCategoryNav,useExamCategory} from './ExamCategoryNav';
import {ImportedPracticePage} from '@/pages/ImportedPracticePage';
export function ExamSkillArea({skill,children}){
 const [category,setCategory]=useExamCategory();const {navigate}=useRouter();
 if(skill==='listening')return children;
 if(skill==='speaking')return <InterviewStudio conversationMode onBack={()=>navigate('/skills')}/>;
 if(skill==='interview')return <div className="space-y-4"><div className="surface px-3 py-1.5 border border-border rounded-lg inline-flex items-center shadow-2xs"><ExamCategoryNav value={category} onChange={setCategory}/></div><InterviewStudio examCategory={category} onBack={()=>navigate('/skills')}/></div>;
 if(skill==='pronunciation')return children;
 if(category!=='general')return <ImportedPracticePage skill={skill}/>;
 return <div className="space-y-4"><div className="surface px-3 py-1.5 border border-border rounded-lg inline-flex items-center shadow-2xs"><ExamCategoryNav value={category} onChange={setCategory}/></div>{children}</div>;
}
