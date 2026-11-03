export const WRITING_DRAFT_KEY='sprach_core_writing_drafts';
export function createWritingDrafts({client}){
 let owner=null,generation=0,document=null,queue=Promise.resolve();
 const reset=()=>{owner=client.getUser()?.id||null;generation++;document=null;queue=Promise.resolve();};
 const changed=()=>Object.assign(Error('Tài khoản bản nháp đã thay đổi.'),{code:'ACCOUNT_CHANGED'});
 const scope=()=>{if(owner!==client.getUser()?.id)reset();return {owner,generation};};
 const check=s=>{if(s.owner!==client.getUser()?.id||s.generation!==generation)throw changed();};
 return {reset,async load(){reset();const s=scope();if(!s.owner)throw changed();const rows=await client.loadState([WRITING_DRAFT_KEY]);check(s);const value=rows[WRITING_DRAFT_KEY]?.value??{byTask:{}};if(!value||typeof value!=='object'||!value.byTask||typeof value.byTask!=='object'||Array.isArray(value.byTask)||Object.values(value.byTask).some(d=>!d||typeof d.text!=='string'||d.text.length>100000))throw Error('Bản nháp viết chưa hợp lệ; chưa ghi đè.');document=structuredClone(value);return structuredClone(document.byTask);},
 text(taskId){scope();return document?.byTask?.[taskId]?.text||'';},
 save(taskId,text){const s=scope();if(!s.owner||!document)return Promise.reject(Error('Bản nháp chưa tải xong.'));if(typeof taskId!=='string'||!taskId||taskId.length>600||typeof text!=='string'||text.length>100000)return Promise.reject(Error('Bản nháp quá lớn hoặc thiếu đề bài.'));const captured=text;const next=queue.catch(()=>{}).then(async()=>{check(s);if(document.byTask[taskId]?.text===captured)return;const value={...document,byTask:{...document.byTask,[taskId]:{...document.byTask[taskId],text:captured,updatedAt:Date.now()}}};await client.saveState(WRITING_DRAFT_KEY,value);check(s);document=value;});queue=next;return next;}
 };
}
