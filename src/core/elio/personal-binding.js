// Private profile and notes cache. All mutations wait for a server CAS acknowledgement.
export function createPersonalBinding({client, legacy, isActive, notify=()=>{}, now=()=>new Date().toISOString(), uuid=()=>crypto.randomUUID()}) {
  const keys=['sprach_profile','sprach_notes'];
  let owner=null,epoch=0,loaded=false,profile={},notes=[],envelope=null,queue=Promise.resolve();
  const fail=(code,message)=>Object.assign(Error(message),{code});
  function reset(){owner=client.getUser()?.id||null;epoch++;loaded=false;profile={};notes=[];envelope=null;queue=Promise.resolve();}
  function scope(){if(owner!==(client.getUser()?.id||null))reset();return {owner,epoch};}
  function check(s){if(s.owner!==client.getUser()?.id||s.epoch!==epoch)throw fail('ACCOUNT_CHANGED','Tài khoản đã thay đổi; không áp dụng dữ liệu cũ.');}
  function serial(work){const s=scope();if(!s.owner)return Promise.reject(fail('AUTH_REQUIRED','Bạn cần đăng nhập.'));const task=queue.catch(()=>{}).then(()=>{check(s);return work(s);});queue=task;return task;}
  async function load(s){
    const records=await client.loadState([...keys,'settings']);check(s);
    const settings=records.settings?.value,legacy={};if(settings&&typeof settings==='object'&&!Array.isArray(settings)){const name=settings.userProfile?.name;if(typeof name==='string'&&name.trim()&&name.length<=100)legacy.display_name=name;if(Number.isInteger(settings.dailyGoal)&&settings.dailyGoal>=5&&settings.dailyGoal<=100)legacy.daily_goal=settings.dailyGoal;}
    const p=Object.hasOwn(records,keys[0])?records[keys[0]].value:legacy,raw=Object.hasOwn(records,keys[1])?records[keys[1]].value:[],n=Array.isArray(raw)?raw:raw?.notes;
    if(!p||typeof p!=='object'||Array.isArray(p)||!Array.isArray(n)||n.some(v=>!v||typeof v.id!=='string'||!v.id)||new Set(n.map(v=>v.id)).size!==n.length)throw fail('PERSONAL_INVALID','Dữ liệu cá nhân chưa hợp lệ; chưa dùng bản cục bộ thay thế.');
    profile=structuredClone(p);notes=structuredClone(n);envelope=Array.isArray(raw)?null:structuredClone(raw);loaded=true;notify();
  }
  const hydrate=()=>!isActive()?Promise.resolve():serial(load);
  async function edit(name,change){return serial(async s=>{if(!loaded)throw fail('PERSONAL_NOT_LOADED','Chờ tải dữ liệu cá nhân trước khi lưu.');const value=change();await client.saveState(name,value);check(s);if(name===keys[0])profile=structuredClone(value);else{notes=structuredClone(Array.isArray(value)?value:value.notes);envelope=Array.isArray(value)?null:structuredClone(value);}notify();return value;});}
  const notesValue=n=>envelope?{...envelope,notes:n}:n;
  const api={
    learnerProfile:{
      get(){scope();if(!isActive())return legacy.learnerProfile.get();return {...{display_name:client.getUser()?.name||'',target_level:'B1',exam_date:'',daily_goal:20},...structuredClone(profile),id:'profile_'+(owner||''),user_id:owner};},
      update(updates){if(!isActive())return legacy.learnerProfile.update(updates);return (async()=>{const captured=structuredClone(updates);const allowed=['display_name','target_level','exam_date','daily_goal'];if(Object.keys(captured).some(k=>!allowed.includes(k))||typeof captured.display_name!=='string'||!captured.display_name.trim()||captured.display_name.length>100||!['A1','A2','B1','B2','C1','C2'].includes(captured.target_level)||!Number.isInteger(captured.daily_goal)||captured.daily_goal<5||captured.daily_goal>100||typeof captured.exam_date!=='string'||(captured.exam_date&&!/^\d{4}-\d{2}-\d{2}$/.test(captured.exam_date)))throw fail('PROFILE_INPUT','Cài đặt học tập không hợp lệ.');await edit(keys[0],()=>({...profile,...captured}));return api.learnerProfile.get();})();}
    },
    notes:{
      findMany(filter={}){scope();if(!isActive())return legacy.notes.findMany(filter);return structuredClone(notes).filter(n=>!filter.type||filter.type==='all'||n.type===filter.type).sort((a,b)=>(Date.parse(b.created_at)||0)-(Date.parse(a.created_at)||0));},
      create(data){if(!isActive())return legacy.notes.create(data);return (async()=>{const note={...fields(data),id:uuid(),created_at:now()};await edit(keys[1],()=>notesValue([note,...notes]));return note;})();},
      update(id,data){if(!isActive())return legacy.notes.update(id,data);return (async()=>{const patch=fields(data);let updated;await edit(keys[1],()=>{const existing=notes.find(n=>n.id===id);if(!existing)throw fail('NOTE_NOT_FOUND','Không tìm thấy ghi chú của tài khoản hiện tại.');updated={...existing,...patch,updated_at:now()};return notesValue(notes.map(n=>n.id===id?updated:n));});return updated;})();},
      delete(id){if(!isActive())return legacy.notes.delete(id);return (async()=>{await edit(keys[1],()=>{if(!notes.some(n=>n.id===id))throw fail('NOTE_NOT_FOUND','Không tìm thấy ghi chú của tài khoản hiện tại.');return notesValue(notes.filter(n=>n.id!==id));});return true;})();}
    }
  };
  function fields(data){if(typeof data.title!=='string'||!data.title.trim()||data.title.length>300||typeof data.content!=='string'||data.content.length>200000||!['note','draft','document'].includes(data.type))throw fail('NOTE_INPUT','Nội dung ghi chú không hợp lệ.');return {title:data.title.trim(),content:data.content,type:data.type};}
  return {api,hydrate,reset,isActive};
}
