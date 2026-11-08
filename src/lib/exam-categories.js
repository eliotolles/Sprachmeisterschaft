export const EXAM_CATEGORIES=[['general','Học chung'],['telc','telc'],['Goethe','Goethe'],['ÖSD','ÖSD'],['DTZ','DTZ'],['ECL','ECL'],['TestDaF','TestDaF'],['DSH','DSH'],['unclassified','Chưa phân loại']];
export const examCategory=value=>EXAM_CATEGORIES.some(([id])=>id===value)?value:null;
const canonical=value=>{const v=String(value||'').trim().toLocaleLowerCase();return EXAM_CATEGORIES.find(([id])=>id.toLocaleLowerCase()===v)?.[0]||null;};
export function recordExamCategory(row){
 let d=row.data||{};if(typeof d==='string'){try{d=JSON.parse(d);}catch{return 'unclassified';}}
 const explicit=canonical(d.examBoard||row.examBoard);if(explicit)return explicit;
 const metadata=[d.exam,d.provider,row.exam,row.provider,...(d.items||[]).map(i=>i.examBoard||i.exam)].map(canonical).filter(Boolean);
 const distinct=[...new Set(metadata)];if(distinct.length)return distinct.length===1?distinct[0]:'unclassified';
 if(['reading-screenshots-20261107','telc18-prepared-v1'].includes(d.sourceBundle))return 'telc';
 // Only explicit exam names in the title; never classify from passage content.
 const title=String(row.title||d.name||'');const matches=EXAM_CATEGORIES.filter(([id])=>!['general','unclassified'].includes(id)&&new RegExp('(?:^|[^\\p{L}])'+id+'(?:$|[^\\p{L}])','iu').test(title));
 return matches.length===1?matches[0][0]:'unclassified';
}
export function recordMatchesSkill(row,skill){
 if(!skill)return true;if(row.kind===skill)return true;if(row.kind!=='exam')return skill==='sprachbausteine'&&row.kind==='grammar'&&/sprachbausteine/i.test(row.title);
 let d=row.data||{};try{if(typeof d==='string')d=JSON.parse(d);}catch{return false;}
 return (d.items||[]).some(i=>i.skill===skill);
}
