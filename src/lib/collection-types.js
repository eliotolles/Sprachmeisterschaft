export const COLLECTION_SKILLS={
 all:'Tất cả kỹ năng',vocabulary:'Từ vựng',reading:'Đọc',listening:'Nghe',
 writing:'Viết',speaking:'Nói',pronunciation:'Phát âm',grammar:'Ngữ pháp',
 interview:'Phỏng vấn',exam:'Luyện thi',situation:'Giao tiếp',
};
export function collectionAccepts(skill,kind){
 if(skill==='all'||skill===kind||skill==='vocabulary'&&kind==='vocab')return true;
 if(kind==='exam')return ['reading','listening','writing','speaking','interview'].includes(skill);
 return kind==='speaking'&&['pronunciation','interview'].includes(skill);
}
export function collectionSkillForPath(path){
 if(path.startsWith('/vocabulary/situations'))return 'situation';
 if(path.startsWith('/vocabulary'))return 'vocabulary';
 if(path.startsWith('/exams'))return 'exam';
 const skill=path.split('/')[2];
 return path.startsWith('/skills/')&&COLLECTION_SKILLS[skill]?skill:'all';
}
export function activeCollectionId(){
 if(typeof window==='undefined')return '';
 return new URLSearchParams(window.location.hash.split('?')[1]||'').get('collection')||'';
}
export function collectionRoute(skill,id){
 const base={vocab:'/vocabulary',vocabulary:'/vocabulary',grammar:'/skills/grammar',exam:'/exams',reading:'/skills/reading',listening:'/skills/listening',writing:'/skills/writing',speaking:'/skills/interview',interview:'/skills/interview',pronunciation:'/skills/pronunciation',situation:'/vocabulary/situations'}[skill]||'/skills';
 return base+'?collection='+encodeURIComponent(id);
}
