import {recordExamCategory} from './exam-categories.js';
export const EXAM_SKILLS={reading:'Lesen · Đọc',sprachbausteine:'Sprachbausteine',listening:'Hören · Nghe',writing:'Schreiben · Viết',speaking:'Sprechen · Nói',grammar:'Ngữ pháp'};
export function trainingData(row){try{return typeof row.data==='string'?JSON.parse(row.data):row.data||{};}catch{return {};}}
export function trainingStatus(progress){return progress?.submitted?'submitted':progress?.startedAt||progress?.answeredIds?.length?'progress':'new';}
export function examTrainingSets(records,folders=[]){
 const groups=new Map(),folderMap=new Map(folders.map(f=>[f.id,f]));
 for(const row of records){const data=trainingData(row),exam=recordExamCategory(row),level=row.level||'Chưa phân cấp',folder=data.organizerId;
  const key=JSON.stringify([exam,level,folder||row.id]);
  if(!groups.has(key))groups.set(key,{id:key,exam,level,title:folderMap.get(folder)?.name||row.title.replace(/\s*[·–-]\s*(Lesen|Hören|Schreiben|Sprechen|Sprachbausteine)\s*$/i,''),records:[],parts:[],statuses:[]});
  const group=groups.get(key);group.records.push(row);group.statuses.push(trainingStatus(data.progress));
  for(const item of data.items||[]){const skill=item.skill||(row.kind==='exam'?null:row.kind);if(!Object.hasOwn(EXAM_SKILLS,skill))continue;
   group.parts.push({id:row.id+':'+item.id,sectionId:item.id,recordId:row.id,title:item.title||row.title,skill,teil:Number(item.teil)||Number(item.title?.match(/Teil\s*(\d+)/i)?.[1])||null,questions:Number(item.questionCount)||0,answered:(data.progress?.answeredIds||[]).filter(id=>id.startsWith(item.id+':')).length,status:trainingStatus(data.progress)});
  }
 }
 return [...groups.values()].map(g=>({...g,status:g.statuses.every(s=>s==='submitted')?'submitted':g.statuses.some(s=>s!=='new')?'progress':'new'})).sort((a,b)=>a.title.localeCompare(b.title,'de'));
}
export function filterExamTrainingSets(sets,{exam,level='ALL',skill='ALL',status='ALL',query=''}){
 const text=query.trim().toLocaleLowerCase('de');return sets.filter(s=>(!exam||s.exam===exam)&&(level==='ALL'||s.level===level)&&(status==='ALL'||s.status===status)&&(skill==='ALL'||s.parts.some(p=>p.skill===skill))&&(!text||[s.title,...s.parts.map(p=>p.title)].join(' ').toLocaleLowerCase('de').includes(text)));
}
