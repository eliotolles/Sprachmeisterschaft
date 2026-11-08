import {InterviewStudio} from '@/components/skills/InterviewStudio';
import {useRouter} from '@/lib/router';
import React from 'react';
import {ExamCategoryNav,useExamCategory} from './ExamCategoryNav';
import {ImportedPracticePage} from '@/pages/ImportedPracticePage';
export function ExamSkillArea({skill,children}){
 const [category,setCategory]=useExamCategory();const {navigate}=useRouter();
 if(skill==='speaking')return <InterviewStudio conversationMode onBack={()=>navigate('/skills')}/>;
 if(skill==='interview')return <div className="space-y-5"><ExamCategoryNav value={category} onChange={setCategory}/><InterviewStudio examCategory={category} onBack={()=>navigate('/skills')}/></div>;
 if(skill==='pronunciation')return children;
 if(category!=='general')return <ImportedPracticePage skill={skill}/>;
 return <div className="space-y-5"><ExamCategoryNav value={category} onChange={setCategory}/>{children}</div>;
}
