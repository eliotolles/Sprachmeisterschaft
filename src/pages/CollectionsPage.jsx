import React,{useEffect,useRef,useState} from 'react';
import {FolderPlus,FolderOpen,ArrowRight,ArrowLeft,Plus,MoveRight} from 'lucide-react';
import {toast} from 'sonner';
import {PageHeader} from '@/components/ui/PageHeader';
import {CreateCollectionDialog} from '@/components/common/CollectionTools';
import {UniversalImportModal} from '@/components/common/UniversalImportModal';
import {elioClient} from '@/lib/elio-auth-runtime';
import {COLLECTION_SKILLS,collectionRoute} from '@/lib/collection-types';
import {useRouter} from '@/lib/router';
import {LookupText} from '@/components/vocabulary/WordDetail';

const kinds=['vocab','grammar','exam','listening','writing','speaking','reading','situation'];
export function CollectionsPage({skill='all',collectionId=null}){
 const {navigate}=useRouter();
 const [folders,setFolders]=useState([]),[collection,setCollection]=useState(null),[records,setRecords]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [creating,setCreating]=useState(false),[importing,setImporting]=useState(false),[attaching,setAttaching]=useState(false),[candidates,setCandidates]=useState([]),[selected,setSelected]=useState(''),[busy,setBusy]=useState(false),[opened,setOpened]=useState(null);
 const generation=useRef(0);
 const load=async()=>{
  const current=++generation.current;setLoading(true);setError('');
  try{
   if(collectionId){const result=await elioClient.collectionContents(collectionId);if(current!==generation.current)return;setCollection(result.collection);setRecords(result.items);}
   else{const result=await elioClient.collections();if(current!==generation.current)return;setFolders(result.items.filter(item=>skill==='all'||item.skill==='all'||item.skill===skill));}
  }catch(failure){if(current===generation.current)setError(failure.message);}
  finally{if(current===generation.current)setLoading(false);}
 };
 useEffect(()=>{setOpened(null);load();const changed=()=>{setCollection(null);setRecords([]);setFolders([]);load();};window.addEventListener('sprach_auth_change',changed);return()=>{generation.current++;window.removeEventListener('sprach_auth_change',changed);};},[collectionId,skill]);
 const openAttach=async()=>{
  const current=generation.current,owner=elioClient.getUser()?.id;
  setBusy(true);
  try{
   const items=[];
   for(const kind of kinds)for(let offset=0;offset<10000;offset+=200){
    const rows=await elioClient.records(kind,{limit:200,offset,collectionId:null});
    if(current!==generation.current||owner!==elioClient.getUser()?.id)return;
    items.push(...rows.filter(row=>{try{return JSON.parse(row.data).organizerId!==collectionId;}catch{return false;}}));
    if(rows.length<200)break;
    if(offset===9800)throw Error('Quá nhiều tài liệu; hãy lọc hoặc chia nhỏ nguồn.');
   }
   setCandidates(items);setSelected('');setAttaching(true);
  }catch(failure){toast.error(failure.message);}finally{setBusy(false);}
 };
 const attach=async()=>{
  if(!selected||busy)return;setBusy(true);
  try{await elioClient.moveCollectionRecord({recordId:selected,collectionId});setAttaching(false);await load();toast.success('Đã chuyển tài liệu vào bộ.');window.dispatchEvent(new CustomEvent('sprach_core_imported'));}
  catch(failure){toast.error(failure.message);}finally{setBusy(false);}
 };
 const type=collection?.skill==='all'?'vocabulary':{pronunciation:'speaking',interview:'speaking'}[collection?.skill]||collection?.skill||'vocabulary';
 return <div className="space-y-6">
  <PageHeader eyebrow="SẮP XẾP HỌC TẬP" title={collection?.name||'Các bộ học'} subtitle={collection?COLLECTION_SKILLS[collection.skill]+' · '+(collection.visibility==='public'?'Kho chung':'Cá nhân'):'Gom tài liệu theo kỹ năng, chủ đề và mục tiêu học.'} actions={<div className="flex gap-2 flex-wrap">
   {collectionId?(collection?.canEdit&&<><button className="tap px-3 py-2 bg-card border border-border rounded-sm font-heading" onClick={()=>setImporting(true)}><Plus className="inline w-4 h-4 mr-1"/>Import vào bộ</button><button disabled={busy} className="tap px-3 py-2 bg-card border border-border rounded-sm font-heading disabled:opacity-50" onClick={openAttach}><MoveRight className="inline w-4 h-4 mr-1"/>Thêm tài liệu có sẵn</button></>):<button className="tap px-3 py-2 bg-accent text-accent-foreground rounded-sm font-heading" onClick={()=>setCreating(true)}><FolderPlus className="inline w-4 h-4 mr-1"/>Tạo bộ</button>}
  </div>}/>
  {collectionId&&<button onClick={()=>navigate('/collections/all')} className="tap text-sm text-accent"><ArrowLeft className="inline w-4 h-4 mr-1"/>Các bộ học</button>}
  {loading&&<p className="font-body text-muted-foreground">Đang tải bộ học…</p>}
  {error&&<div role="alert" className="surface p-4 border border-border font-body">{error}<button className="tap ml-3 text-accent underline" onClick={load}>Thử lại</button></div>}
  {!loading&&!error&&!collectionId&&<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{folders.length?folders.map(folder=><button key={folder.id} onClick={()=>navigate('/collections/view/'+folder.id)} className="surface border border-border p-5 text-left space-y-3"><FolderOpen className="w-5 h-5 text-accent"/><h2 className="font-heading text-xl font-semibold">{folder.name}</h2><p className="font-body text-sm text-muted-foreground">{COLLECTION_SKILLS[folder.skill]} · {folder.visibility==='public'?'Kho chung':'Cá nhân'}</p></button>):<p className="font-body text-muted-foreground">Chưa có bộ. Chọn Tạo bộ để bắt đầu sắp xếp.</p>}</div>}
  {!loading&&!error&&collectionId&&<div className="space-y-3">{records.length?records.map(record=>{
   let data;try{data=JSON.parse(record.data);}catch{return <p key={record.id}>Tài liệu chưa đọc được.</p>;}
   const count=data.words?.length??data.items?.length??1;
   return <div key={record.id} className="surface p-5 border border-border space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-lg font-semibold">{record.title}</h2><p className="font-body text-sm text-muted-foreground">{COLLECTION_SKILLS[record.kind==='vocab'?'vocabulary':record.kind]} · {record.level} · {count} mục</p></div><div className="flex gap-2 flex-wrap"><button className="tap px-3 py-1.5 border border-border rounded-sm font-heading text-sm" onClick={()=>setOpened(opened===record.id?null:record.id)}>Xem nội dung</button><button className="tap px-3 py-1.5 bg-accent text-accent-foreground rounded-sm font-heading text-sm" onClick={()=>record.kind==='situation'?setOpened(record.id):navigate(record.kind==='exam'?'/exams/'+encodeURIComponent(record.id)+'?collection='+collectionId:collectionRoute(record.kind==='speaking'?(collection.skill==='pronunciation'?'pronunciation':collection.skill==='interview'?'interview':'speaking'):record.kind,collectionId))}>{record.kind==='situation'?'Đọc & tra từ':'Mở luyện tập'} <ArrowRight className="inline w-4 h-4"/></button></div></div>
    {opened===record.id&&<div className="font-body text-sm leading-relaxed whitespace-pre-wrap border-t border-border pt-4">{(data.words||data.items||[data]).map((item,index)=><div key={item.id||index} className="mb-4"><h3 className="font-heading font-semibold">{item.de||item.german||item.title||''}</h3><LookupText text={item.content||item.rule||item.vi||item.vietnamese||''}/></div>)}</div>}
   </div>;
  }):<p className="font-body text-muted-foreground">Bộ đang trống. Import tài liệu hoặc chuyển tài liệu có sẵn vào bộ.</p>}</div>}
  {collectionId&&collection?.skill==='vocabulary'&&<div className="surface p-4 border border-border flex flex-wrap gap-3 font-heading text-sm"><button className="tap text-accent" onClick={()=>navigate('/review?collection='+collectionId)}>Ôn thẻ SRS</button><button className="tap text-accent" onClick={()=>navigate('/game?collection='+collectionId)}>Luyện phản xạ mạo từ</button><button className="tap text-accent" onClick={()=>navigate('/vocabulary?collection='+collectionId)}>Quản lý từ trong bộ</button></div>}
  {attaching&&<div className="surface p-5 border border-border space-y-3"><h2 className="font-heading text-lg">Chọn tài liệu có sẵn</h2><select aria-label="Tài liệu có sẵn" value={selected} onChange={e=>setSelected(e.target.value)} className="w-full p-2 bg-card border border-border font-body"><option value="">Chọn tài liệu</option>{candidates.map(record=><option key={record.id} value={record.id}>{record.title} · {record.kind} · {record.public?'Kho chung':'Cá nhân'}</option>)}</select><button disabled={!selected||busy} onClick={attach} className="tap px-3 py-2 bg-accent text-accent-foreground font-heading disabled:opacity-50">Chuyển vào bộ</button><button onClick={()=>setAttaching(false)} className="tap ml-3 font-heading">Hủy</button></div>}
  <CreateCollectionDialog open={creating} initialSkill={skill} onClose={()=>setCreating(false)} onCreated={folder=>navigate('/collections/view/'+folder.id)}/>
  <UniversalImportModal isOpen={importing} onClose={()=>setImporting(false)} defaultType={type} defaultCollectionId={collectionId} initialScope={collection?.visibility} onSuccess={()=>{setImporting(false);load();}}/>
 </div>;
}
