import {ImportedContentManager} from './ImportedContentManager';
import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FolderPlus,FolderOpen,X} from 'lucide-react';
import {toast} from 'sonner';
import {db} from '@/lib/db';
import {elioClient} from '@/lib/elio-auth-runtime';
import {useRouter} from '@/lib/router';
import {COLLECTION_SKILLS,collectionSkillForPath,collectionAccepts} from '@/lib/collection-types';

export function CreateCollectionDialog({open,onClose,onCreated,initialSkill='all'}){
 const [name,setName]=useState(''),[skill,setSkill]=useState(initialSkill),[visibility,setVisibility]=useState('private'),[busy,setBusy]=useState(false);
 const request=useRef({key:'',id:''}),pending=useRef(false),generation=useRef(0);
 useEffect(()=>{generation.current++;if(open){setName('');setSkill(initialSkill);setVisibility('private');setBusy(false);request.current={key:'',id:''};}},[open,initialSkill]);
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[open]);
 if(!open)return null;
 const save=async event=>{
  event.preventDefault();if(pending.current)return;
  const owner=db.auth.getUser()?.id,current=generation.current,payload={name:name.trim(),skill,visibility};
  if(!payload.name)return toast.error('Nhập tên bộ học.');
  const key=JSON.stringify(payload);
  if(request.current.key!==key)request.current={key,id:crypto.randomUUID()};
  pending.current=true;setBusy(true);
  try{
   const result=await elioClient.createCollection({...payload,requestId:request.current.id});
   if(owner!==db.auth.getUser()?.id||current!==generation.current)return;
   window.dispatchEvent(new CustomEvent('sprach_collections_change'));
   onCreated(result.collection);onClose();toast.success('Đã tạo bộ '+result.collection.name);
  }catch(error){if(current===generation.current)toast.error(error.message);}
  finally{pending.current=false;if(current===generation.current)setBusy(false);}
 };
 return createPortal(<div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
  <form role="dialog" aria-modal="true" aria-label="Tạo bộ học" onSubmit={save} className="surface border border-border p-6 w-full max-w-md space-y-4">
   <div className="flex items-center justify-between"><h2 className="font-heading text-xl font-semibold">Tạo bộ học</h2><button type="button" onClick={onClose} aria-label="Đóng tạo bộ" className="tap p-2"><X className="w-4 h-4"/></button></div>
   <label className="block text-sm font-body">Tên bộ<input autoFocus required maxLength={150} value={name} onChange={e=>setName(e.target.value)} className="block mt-1 w-full bg-card border border-border rounded-sm p-2 font-body" placeholder="Ví dụ: Goethe B1 · Tháng 12"/></label>
   <label className="block text-sm font-body">Kỹ năng<select value={skill} onChange={e=>setSkill(e.target.value)} className="block mt-1 w-full bg-card border border-border rounded-sm p-2 font-body">{Object.entries(COLLECTION_SKILLS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <label className="block text-sm font-body">Phạm vi<select value={visibility} onChange={e=>setVisibility(e.target.value)} className="block mt-1 w-full bg-card border border-border rounded-sm p-2 font-body"><option value="private">Cá nhân</option>{db.auth.isAdmin()&&<option value="public">Kho chung</option>}</select></label>
   <button type="submit" disabled={busy} className="tap px-4 py-2 rounded-sm bg-accent text-accent-foreground font-heading disabled:opacity-50">{busy?'Đang tạo…':'Tạo bộ'}</button>
  </form>
 </div>,document.body);
}

export function CollectionToolbar(){
 const {currentPath,search,navigate}=useRouter();
 const [creating,setCreating]=useState(false),[managing,setManaging]=useState(false);
 const supported=currentPath.startsWith('/vocabulary')||currentPath.startsWith('/skills')||currentPath.startsWith('/exams')||currentPath==='/admin'||currentPath.startsWith('/collections')||currentPath.startsWith('/listening')||currentPath.startsWith('/videos')||currentPath==='/personal-videos'||currentPath.startsWith('/practice');
 if(!supported)return null;
 const skill=collectionSkillForPath(currentPath),collection=new URLSearchParams(search).get('collection');
 return <div className="flex flex-wrap items-center justify-end gap-2 mb-4 font-body">
  {collection&&<button type="button" className="tap px-3 py-1.5 rounded-sm border border-border text-sm" onClick={()=>navigate('/collections/view/'+encodeURIComponent(collection))}>Về bộ đang học</button>}
  <button type="button" onClick={()=>setCreating(true)} className="tap px-3 py-1.5 rounded-sm border border-border bg-card text-sm inline-flex items-center gap-2"><FolderPlus className="w-4 h-4"/>Tạo bộ</button>
  <button type="button" onClick={()=>navigate('/collections/'+skill)} className="tap px-3 py-1.5 rounded-sm border border-border bg-card text-sm inline-flex items-center gap-2"><FolderOpen className="w-4 h-4"/>Các bộ học</button>
  <button type="button" onClick={()=>navigate('/practice')} className="tap px-3 py-1.5 rounded-sm border border-border bg-card text-sm">Luyện đề đã import</button>
  <button type="button" onClick={()=>setManaging(true)} className="tap px-3 py-1.5 rounded-sm border border-border bg-card text-sm">Sửa / Xóa nội dung import</button>
  {managing&&<ImportedContentManager onClose={()=>setManaging(false)} collectionId={collection||null}/>}
  <CreateCollectionDialog open={creating} onClose={()=>setCreating(false)} initialSkill={skill} onCreated={value=>navigate('/collections/view/'+value.id)}/>
 </div>;
}

export function ImportCollectionTarget({contentType,value,onChange,onScopeChange}){
 const [items,setItems]=useState([]),[creating,setCreating]=useState(false),[failure,setFailure]=useState('');
 useEffect(()=>{
  let current=true;
  elioClient.collections().then(result=>{if(current){setItems(result.items);setFailure('');}}).catch(error=>{if(current)setFailure(error.message);});
  return()=>{current=false;};
 },[]);
 const matching=items.filter(item=>item.canEdit&&collectionAccepts(item.skill,contentType==='vocabulary'?'vocab':contentType));
 useEffect(()=>{
  const selected=items.find(item=>item.id===value);
  if(selected&&!collectionAccepts(selected.skill,contentType==='vocabulary'?'vocab':contentType))onChange('');
  else if(selected)onScopeChange(selected.visibility);
 },[value,items,contentType]);
 return <div className="border border-border rounded-sm p-4 my-3 space-y-2 font-body">
  <label className="block text-sm font-heading">Nơi lưu sau khi import</label>
  <div className="flex gap-2 flex-wrap"><select aria-label="Bộ nhận nội dung import" value={value||''} onChange={event=>onChange(event.target.value)} className="flex-1 min-w-0 px-3 py-2 border border-border rounded-sm bg-card font-body text-sm">
   <option value="">Import trực tiếp · Chưa xếp bộ</option>
   {matching.map(item=><option key={item.id} value={item.id}>{item.name} · {item.visibility==='public'?'Kho chung':'Cá nhân'}</option>)}
  </select><button type="button" className="tap px-3 py-2 border border-border bg-card rounded-sm font-heading text-sm" onClick={()=>setCreating(true)}><FolderPlus className="inline w-4 h-4 mr-1"/>Tạo bộ mới</button></div>
  {failure&&<p role="alert" className="text-sm text-accent">{failure}</p>}
  <CreateCollectionDialog open={creating} onClose={()=>setCreating(false)} initialSkill={COLLECTION_SKILLS[contentType]?contentType:'all'} onCreated={item=>{setItems(previous=>[...previous.filter(old=>old.id!==item.id),item]);onChange(item.id);onScopeChange(item.visibility);}}/>
 </div>;
}
