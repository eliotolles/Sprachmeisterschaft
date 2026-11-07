import React,{useCallback,useEffect,useState} from 'react';
import {WordDetail} from './WordDetail';
const excluded='a,button,label,input,textarea,select,dialog,[role="button"],[contenteditable="true"],[data-lookup-root],[data-no-lookup]';
export function ScreenWordLookup(){
 const [target,setTarget]=useState(null);const close=useCallback(()=>setTarget(null),[]);
 useEffect(()=>{
  const pointer=event=>{
   if(event.button!==0||event.defaultPrevented||event.target.closest(excluded))return;
   const selected=window.getSelection();let token='',sentence='',rect=null;
   if(selected&&!selected.isCollapsed){token=selected.toString().trim();if(token.length>100)return;rect=selected.getRangeAt(0).getBoundingClientRect();sentence=selected.anchorNode?.parentElement?.textContent?.slice(0,2500)||'';}
   else{
    const point=document.caretPositionFromPoint?.(event.clientX,event.clientY);const range=!point&&document.caretRangeFromPoint?.(event.clientX,event.clientY);
    const node=point?.offsetNode||range?.startContainer,offset=point?.offset??range?.startOffset;
    if(!node||node.nodeType!==Node.TEXT_NODE||!event.target.contains(node)||node.parentElement?.closest(excluded))return;
    const value=node.textContent||'';let start=offset,end=offset;const letter=char=>char&&/[a-zäöüßA-ZÄÖÜẞ-]/u.test(char);
    while(start>0&&letter(value[start-1]))start--;while(end<value.length&&letter(value[end]))end++;
    token=value.slice(start,end);if(token.length<2)return;sentence=node.parentElement?.textContent?.slice(0,2500)||value;
    const bounds=document.createRange();bounds.setStart(node,start);bounds.setEnd(node,end);rect=bounds.getBoundingClientRect();
    if(event.clientX<rect.left-3||event.clientX>rect.right+3||event.clientY<rect.top-3||event.clientY>rect.bottom+3)return;
   }
   if(!/^[a-zäöüßA-ZÄÖÜẞ][a-zäöüßA-ZÄÖÜẞ ()-]{0,99}$/u.test(token))return;
   setTarget({token,sentence,rect,anchor:event.target});
  };
  document.addEventListener('click',pointer);
  const closeOnNavigate=()=>setTarget(null);window.addEventListener('hashchange',closeOnNavigate);
  return()=>{document.removeEventListener('click',pointer);window.removeEventListener('hashchange',closeOnNavigate);};
 },[]);
 return target?<WordDetail key={target.token} target={target} onClose={close}/>:null;
}
