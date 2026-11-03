import {useEffect,useState} from 'react';import {toast} from 'sonner';import {newProgressBinding,progressCoreActive} from './elio-progress-runtime.js';
export function useCoreProgress(db,setters){
 const active=progressCoreActive(),[core]=useState(newProgressBinding);
 useEffect(()=>{
  if(!active)return;let cancelled=false,timer=null,epoch=0;
  const clear=()=>Object.values(setters).forEach(setter=>setter([]));
  const load=async()=>{const current=++epoch;try{const data=await core.load();if(cancelled||current!==epoch)return;setters.cards?.(db.vocabulary.isCore?.()?db.vocabulary.findMany():[]);for(const name of ['logs','sessions','exams','notes'])setters[name]?.(data[name]);}catch(error){if(!cancelled&&current===epoch&&error.code!=='ACCOUNT_CHANGED'){clear();toast.error(error.message);}}};
  const refresh=()=>{clearTimeout(timer);timer=setTimeout(load,75);};
  const accountChanged=()=>{epoch++;core.reset();clear();refresh();};
  load();window.addEventListener('sprach_auth_change',accountChanged);window.addEventListener('sprach_db_change',refresh);window.addEventListener('focus',refresh);
  return()=>{cancelled=true;epoch++;core.reset();clearTimeout(timer);window.removeEventListener('sprach_auth_change',accountChanged);window.removeEventListener('sprach_db_change',refresh);window.removeEventListener('focus',refresh);};
 },[active,db]);
 return active;
}
