import corpus from './data/telc18-prepared.json' with {type:'json'};
import {coreError,query} from './database.js';
export async function installTelcBundle(env,user){
 if(!['admin','super_admin'].includes(user.role))throw coreError(403,'ADMIN_REQUIRED','Chỉ Admin được nhập bộ đề chung.');
 const marker='sprach:bundle:'+corpus.id;
 const completed=(await query(env,'SELECT value FROM ee_config WHERE key=?',[marker])).rows[0];
 if(completed){const existing=(await query(env,'SELECT id FROM ee_records WHERE id IN ('+corpus.records.map(()=>'?').join(',')+')',corpus.records.map(row=>row.id))).rows;return {bundleId:corpus.id,total:corpus.records.length,installed:existing.length,inserted:0,remaining:0,completed:true,missing:corpus.missing};}
 const now=new Date().toISOString();
 const folders=corpus.exams.map(exam=>({id:'telc18-'+exam.key,owner:user.id,name:'TELC B1 · '+exam.name,skill:'all',visibility:'public',createdAt:now,sourceBundle:corpus.id}));
 await query(env,'INSERT INTO ee_config(key,value) VALUES '+folders.map(()=>'(?,?)').join(',')+' ON CONFLICT(key) DO NOTHING',folders.flatMap(folder=>['sprach:collection:'+folder.id,JSON.stringify(folder)]));
 const existing=new Set((await query(env,'SELECT id FROM ee_records WHERE id IN ('+corpus.records.map(()=>'?').join(',')+')',corpus.records.map(row=>row.id))).rows.map(row=>row.id));
 const pending=corpus.records.filter(row=>!existing.has(row.id)),batch=pending.slice(0,15);
 let inserted=[];
 if(batch.length){const result=await query(env,'INSERT INTO ee_records(id,owner,kind,title,level,public,data,updated_at) VALUES '+batch.map(()=>'(?,?,?,?,?,?,?,?)').join(',')+' ON CONFLICT(id) DO NOTHING RETURNING id',batch.flatMap(row=>[row.id,user.id,row.kind,row.title,'B1',1,JSON.stringify(row.data),now]));inserted=result.rows.map(row=>row.id);}
 if(existing.size+inserted.length===corpus.records.length)await query(env,'INSERT INTO ee_config(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING',[marker,JSON.stringify({completedAt:now,total:corpus.records.length})]);
 return {bundleId:corpus.id,total:corpus.records.length,installed:existing.size+inserted.length,inserted:inserted.length,remaining:Math.max(0,corpus.records.length-existing.size-inserted.length),missing:corpus.missing};
}
