import {mapSharedElioCard} from '../../lib/shared-vocabulary.js';
import {scheduleReview,toSprachReview} from './srs.js';
const REVIEW='sprach_vocabulary_reviews',ratings=['again','hard','good','easy'];
export function createVocabularyBinding({client,legacy,isActive,notify=()=>{}}){
 let owner=null,epoch=0,cards=[],loaded=false,pending=null,warnings=[],mutations=Promise.resolve();
 const error=(code,message)=>Object.assign(new Error(message),{code});
 const identity=()=>client.getUser()?.id||null;
 const scope=()=>{if(owner!==identity()){owner=identity();epoch++;cards=[];warnings=[];loaded=false;pending=null;}};
 async function hydrate(){scope();if(!isActive()||!owner)return;if(loaded)return;if(pending)return pending;
  const captured=owner,current=epoch;
  pending=(async()=>{
   const catalog=[],seen=new Set(),issues=[];for(let offset=0;offset<10000;offset+=200){const rows=await client.vocabulary({limit:200,offset});if(!Array.isArray(rows))throw error('CATALOG_INVALID','Danh mục từ chưa đọc được.');for(const row of rows){const card=mapSharedElioCard(row);if(seen.has(card.id))throw error('CATALOG_DUPLICATE','Danh mục có ID trùng.');seen.add(card.id);catalog.push({...card,coreSourceId:card.source_id,coreDeckId:null,status:'new'});}if(rows.length<200)break;if(offset===9800)throw error('CATALOG_LIMIT','Danh mục vượt giới hạn an toàn.');}
   for(let offset=0;offset<10000;offset+=200){const records=await client.records('vocab',{limit:200,offset});if(!Array.isArray(records))throw error('DECK_INVALID','Bộ từ chưa đọc được.');for(const record of records){if(record.public)continue;let data;try{data=JSON.parse(record.data);}catch{throw error('DECK_INVALID','Bộ từ chưa đọc được; chưa thay dữ liệu.');}if(!Array.isArray(data.words))continue;for(const [index,word] of data.words.entries()){if(!word||typeof word.de!=='string'||!word.de.trim()||typeof word.vi!=='string')throw error('DECK_INVALID','Một từ cá nhân chưa hợp lệ.');if(typeof word.id!=='string'||!word.id)issues.push({recordId:record.id,index,code:'SOURCE_ID_MISSING'});const id='elio_deck_'+encodeURIComponent(record.id)+'_'+(typeof word.id==='string'&&word.id?encodeURIComponent(word.id):'missing_'+index);if(seen.has(id))throw error('DECK_DUPLICATE','Bộ từ có ID trùng.');seen.add(id);catalog.push({id,german:word.de,vietnamese:word.vi,article:word.article||'',word_type:word.type||word.word_type||'',english:word.english||'',level:word.level||record.level,topic:word.topic||record.title,example_de:word.example||word.example_de||'',example_vi:word.exampleVi||word.example_vi||'',source_id:word.id,coreSourceId:typeof word.id==='string'&&word.id?word.id:null,coreDeckId:record.id,is_shared:!!record.public,status:'new'});}}if(records.length<200)break;if(offset===9800)throw error('DECK_LIMIT','Quá nhiều bộ từ.');}
   const state=await client.loadState([REVIEW,'vocab']);
   if(Object.hasOwn(state,'vocab')){const legacy=state.vocab.value;if(!Array.isArray(legacy))throw error('LEGACY_VOCAB_INVALID','Bộ từ cá nhân cũ chưa hợp lệ; không tự thay dữ liệu.');for(const word of legacy){if(!word||typeof word.id!=='string'||!word.id||typeof word.de!=='string'||!word.de.trim()||typeof word.vi!=='string')throw error('LEGACY_VOCAB_INVALID','Từ cũ thiếu ID hoặc nội dung nguồn; chưa tự sửa ID.');const id='elio_legacy_'+encodeURIComponent(word.id);if(seen.has(id))throw error('LEGACY_VOCAB_DUPLICATE','ID từ cũ bị trùng.');seen.add(id);catalog.push({id,german:word.de,vietnamese:word.vi,article:['der','die','das'].includes(word.article||word.gender)?(word.article||word.gender):'',word_type:word.type||'',english:word.en||word.english||'',level:word.level||'',topic:word.deckName||'Từ cá nhân từ Elio',example_de:word.example||'',example_vi:word.exampleVi||'',source_id:word.id,coreSourceId:word.id,coreDeckId:'legacy-vocab',legacySource:true,status:'new'});}}
   const progress=state[REVIEW]?.value?.cards||{};
   for(const card of catalog){const key=encodeURIComponent((card.coreDeckId?card.coreDeckId+'|':'')+card.coreSourceId+'|de');if(Object.hasOwn(progress,key))Object.assign(card,toSprachReview(progress[key]));}
   if(captured!==identity()||current!==epoch)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');cards=catalog;warnings=issues;loaded=true;notify({warnings:issues});
  })().finally(()=>{if(current===epoch)pending=null;});return pending;
 }
 function list(filter={}){scope();if(!isActive())return legacy.findMany(filter);if(!owner)return[];let rows=cards;
  if(filter.status&&filter.status!=='all')rows=rows.filter(c=>c.status===filter.status);
  for(const key of ['topic','level'])if(filter[key]&&filter[key]!=='all')rows=rows.filter(c=>c[key]===filter[key]);
  if(filter.dueToday)rows=rows.filter(c=>!c.due_at||c.due_at<=Date.now());
  if(filter.search){const q=String(filter.search).toLocaleLowerCase('de');rows=rows.filter(c=>[c.german,c.vietnamese,c.english].some(s=>String(s||'').toLocaleLowerCase('de').includes(q)));}
  return rows.map(c=>({...c}));
 }
 async function createWords(words){scope();const captured=owner;await hydrate();if(captured!==identity())throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');const result=await client.editVocabulary({action:'create',words:structuredClone(words)});if(captured!==identity()||result.userId!==captured)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');if(!Array.isArray(result.added))throw error('INVALID_RESPONSE','Server chưa xác nhận từ mới.');loaded=false;await hydrate();return cards.filter(c=>c.coreDeckId===result.deckId&&result.added.includes(c.coreSourceId)).map(c=>({...c}));}
 async function editWord(action,id,updates){scope();const card=cards.find(c=>c.id===id);if(!card?.coreDeckId)throw error('PRIVATE_WORD_REQUIRED','Chỉ sửa/xóa từ trong bộ riêng; giữ nguyên nguồn chung.');const captured=owner,deck=await client.vocabularyDeck(card.coreDeckId);if(deck.canEdit===false)throw error('LEGACY_DECK_READ_ONLY','Giữ nguyên bộ nguồn cũ; hãy lưu bản sao vào bộ riêng để chỉnh sửa.');if(captured!==identity())throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');await client.editVocabulary({action,deckId:card.coreDeckId,wordId:card.coreSourceId,revision:deck.revision,...(updates?{word:{...card,...updates}}:{})});if(captured!==identity())throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');loaded=false;await hydrate();return true;}
 async function deleteCards(ids,filter={}){
  scope();const captured=owner,current=epoch;
  const selectedIds=ids?[...new Set(ids)]:null;
  const task=mutations.catch(()=>{}).then(async()=>{
   if(captured!==identity()||current!==epoch)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');
   await hydrate();
   const selected=selectedIds?selectedIds.map(id=>cards.find(card=>card.id===id)).filter(Boolean):list(filter);
   if(selected.some(card=>!card.coreSourceId))throw error('SOURCE_ID_MISSING','Từ thiếu ID nguồn; chưa xóa.');
   if(selected.some(card=>!card.coreDeckId)&&!['admin','super_admin'].includes(client.getUser()?.role))throw error('ADMIN_REQUIRED','Chỉ Admin được xóa từ nguồn chung.');
   const groups=new Map();
   for(const card of selected){const key=card.coreDeckId||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(card.coreSourceId);}
   let completed=0;
   try{
    for(const [deckId,sourceIds] of groups){
     if(captured!==identity()||current!==epoch)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');
     const wordIds=[...new Set(sourceIds)];
     const deck=deckId?await client.vocabularyDeck(deckId):null;
     if(captured!==identity()||current!==epoch)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');
     const result=await client.editVocabulary(deckId?{action:'delete',deckId,wordIds,revision:deck.revision}:{action:'deleteShared',wordIds});
     if(result.userId!==captured||captured!==identity()||current!==epoch)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');
     if(!Array.isArray(result.deleted)||deckId&&result.deckId!==deckId)throw error('DELETE_NOT_CONFIRMED','Máy chủ chưa xác nhận đúng dữ liệu đã xóa.');
     completed++;
    }
   }catch(failure){
    if(completed&&failure.code!=='ACCOUNT_CHANGED')failure.message='Một phần đã được xóa. '+failure.message;
    throw failure;
   }finally{
    if(captured===identity()&&current===epoch){loaded=false;await hydrate();}
   }
   if(captured!==identity()||current!==epoch)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');
   if(selected.some(card=>cards.some(remaining=>remaining.id===card.id)))throw error('DELETE_NOT_CONFIRMED','Từ vẫn còn trên máy chủ; chưa xác nhận xóa thành công.');
   return true;
  });
  mutations=task;return task;
 }
 const api={create:word=>!isActive()?legacy.create(word):createWords([word]).then(rows=>rows[0]||null),createMany:words=>!isActive()?legacy.createMany(words):createWords(words),delete:id=>!isActive()?legacy.delete(id):deleteCards([id]),update:(id,updates)=>!isActive()?legacy.update(id,updates):editWord('update',id,updates),findMany:list,findById:id=>isActive()?list().find(c=>c.id===id)||null:legacy.findById(id),
  clearAll:()=>!isActive()?legacy.clearAll():deleteCards(null),
  deleteByTopic:topic=>!isActive()?legacy.deleteByTopic(topic):deleteCards(null,{topic}),
  deleteByLevel:level=>!isActive()?legacy.deleteByLevel(level):deleteCards(null,{level}),
  isCore:()=>isActive(),warnings:()=>warnings.map(w=>({...w})),
  previewReview:(card,grade)=>toSprachReview(scheduleReview({ease:card.ease_factor??2.5,repetitions:card.repetitions??0,intervalDays:card.interval_days??0,lapses:card.lapses??0},ratings[grade])),
  async review(id,grade){scope();if(!isActive())throw error('CORE_DISABLED','Core từ vựng chưa bật.');if(!Number.isInteger(grade)||grade<0||grade>3)throw error('REVIEW_INPUT','Mức ôn không hợp lệ.');const card=cards.find(c=>c.id===id);if(!card)throw error('WORD_NOT_FOUND','Không tìm thấy thẻ đang ôn.');if(!card.coreSourceId)throw error('SOURCE_ID_MISSING','Từ cũ chưa có ID nguồn; chưa ghi lịch ôn hoặc tự tạo ID.');const captured=owner,current=epoch;
   const result=await client.reviewVocabulary(card.coreSourceId,ratings[grade],{...(card.coreDeckId?{deckId:card.coreDeckId}:{})});if(captured!==identity()||current!==epoch)throw error('ACCOUNT_CHANGED','Tài khoản đã thay đổi.');const updates=toSprachReview(result.review);Object.assign(card,updates);notify();return updates;
  }};
 for(const key of Object.keys(legacy))if(!(key in api))api[key]=(...args)=>{if(!isActive())return legacy[key](...args);throw error('VOCAB_ACTION_PENDING','Thao tác này chưa được nối với server; không sửa bản cục bộ thay thế.');};
 return {api,hydrate,reset(){owner=null;epoch++;cards=[];warnings=[];loaded=false;pending=null;}};
}
