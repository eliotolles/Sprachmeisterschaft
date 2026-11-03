export function createGrammarBinding({client,isActive}) {
 let generation=0;
 const reset=()=>generation++;
 function capture(){const id=client.getUser()?.id;if(!isActive()||!id)throw Error('Chưa đăng nhập core ngữ pháp.');return {id,generation};}
 function check(s){if(s.id!==client.getUser()?.id||s.generation!==generation)throw Object.assign(Error('Tài khoản hoặc bài ngữ pháp đã thay đổi.'),{code:'ACCOUNT_CHANGED'});}
 return {reset,isActive,async catalog(){const s=capture(),all=[];for(let offset=0;offset<10000;offset+=200){const r=await client.grammar({limit:200,offset});check(s);if(!Array.isArray(r.lessons))throw Error('Danh mục ngữ pháp không hợp lệ.');all.push(...r.lessons.map(l=>({...l,key:encodeURIComponent(l.collectionId)+'/'+encodeURIComponent(l.id)})));if(r.lessons.length<200)return all;}throw Error('Danh mục ngữ pháp vượt giới hạn an toàn.');},
 async lesson(row){const s=capture(),r=await client.grammarLesson(row.collectionId,row.id);check(s);if(r.id!==row.id||r.collectionId!==row.collectionId||typeof r.content!=='string'||!Array.isArray(r.exercises)||!Array.isArray(r.mindmap?.groups)||r.exercises.some(e=>typeof e.id!=='string'||typeof e.revision!=='string'||!['quiz','fill','build'].includes(e.type)))throw Error('Bài ngữ pháp chưa hợp lệ.');return r;},
 async submit(lesson,exercise,answer){const s=capture(),r=await client.submitGrammar({collectionId:lesson.collectionId,lessonId:lesson.id,exerciseId:exercise.id,revision:exercise.revision,answer});check(s);if(r.lessonId!==lesson.id||r.exerciseId!==exercise.id||typeof r.feedback?.correct!=='boolean'||!Array.isArray(r.feedback.acceptedAnswers))throw Error('Kết quả không khớp bài ngữ pháp.');return r.feedback;}};
}
