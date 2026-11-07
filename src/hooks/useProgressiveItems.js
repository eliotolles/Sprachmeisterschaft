import {useCallback,useEffect,useRef,useState} from 'react';

// Render the first viewport immediately, then append batches as the user scrolls.
// The source array remains complete for totals, filtering, import and SRS actions.
export function useProgressiveItems(items,resetKey,batchSize=60){
 const [window,setWindow]=useState({key:resetKey,count:batchSize});
 const observer=useRef(null);
 const count=window.key===resetKey?window.count:batchSize;
 const visible=typeof IntersectionObserver==='undefined'?items:items.slice(0,count);
 const lastItemRef=useCallback(node=>{
  observer.current?.disconnect();
  if(!node||count>=items.length||typeof IntersectionObserver==='undefined')return;
  observer.current=new IntersectionObserver(entries=>{
   if(!entries.some(entry=>entry.isIntersecting))return;
   observer.current?.disconnect();
   setWindow(current=>({key:resetKey,count:Math.min(items.length,(current.key===resetKey?current.count:batchSize)+batchSize)}));
  },{rootMargin:'600px'});
  observer.current.observe(node);
 },[resetKey,count,items.length,batchSize]);
 useEffect(()=>()=>observer.current?.disconnect(),[]);
 return {visible,lastItemRef};
}
