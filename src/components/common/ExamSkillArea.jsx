import React from 'react';
import {ExamCategoryNav,useExamCategory} from './ExamCategoryNav';
import {ImportedPracticePage} from '@/pages/ImportedPracticePage';
export function ExamSkillArea({skill,children}){
 const [category,setCategory]=useExamCategory();
 if(category!=='general')return <ImportedPracticePage skill={skill}/>;
 return <div className="space-y-5"><ExamCategoryNav value={category} onChange={setCategory}/>{children}</div>;
}
