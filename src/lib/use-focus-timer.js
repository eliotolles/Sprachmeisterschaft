import {useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
export const focusCoreActive=()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiFocusEnabled===true;
export function useFocusTimer(){
 const enabled=focusCoreActive(),[active,setActive]=useState(null),[remaining,setRemaining]=useState(0),[ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const scope=useRef(0),pending=useRef(false),clock=useRef(null);
 function apply(value,serverNow){if(!Number.isFinite(serverNow)||value&&(typeof value.id!=='string'||!Number.isFinite(value.remainingMs)||!Number.isFinite(value.resumedAt)||typeof value.paused!=='boolean'))throw Error('Đồng hồ server không hợp lệ.');clock.current={serverNow,local:performance.now()};setActive(value);setRemaining(value?(value.paused?value.remainingMs:Math.max(0,value.remainingMs-(serverNow-value.resumedAt))):0);}
 useEffect(()=>{
  if(!enabled)return;let disposed=false;
  const load=async()=>{const current=++scope.current;pending.current=false;setBusy(false);setReady(false);setActive(null);setRemaining(0);try{const [state,stats]=await Promise.all([elioClient.loadState(['sprach_core_focus_sessions']),elioClient.studyStatistics()]);if(disposed||current!==scope.current)return;const value=state.sprach_core_focus_sessions?.value;if(value&&(!Array.isArray(value.sessions)||!Object.hasOwn(value,'active')))throw Error('Lịch sử tập trung chưa hợp lệ.');if(stats.userId!==elioClient.getUser()?.id)throw Error('Đồng hồ không khớp tài khoản.');apply(value?.active||null,stats.serverNow);setReady(true);}catch(e){if(!disposed&&current===scope.current&&e.code!=='ACCOUNT_CHANGED')toast.error(e.message);}};
  load();window.addEventListener('sprach_auth_change',load);return()=>{disposed=true;scope.current++;window.removeEventListener('sprach_auth_change',load);};
 },[enabled]);
 useEffect(()=>{if(!active||active.paused)return;const tick=()=>{const c=clock.current;if(c)setRemaining(Math.max(0,active.remainingMs-(c.serverNow+performance.now()-c.local-active.resumedAt)));};tick();const timer=setInterval(tick,250);return()=>clearInterval(timer);},[active]);
 async function action(action,options={}){if(!enabled||!ready||pending.current)return;pending.current=true;setBusy(true);const current=scope.current;try{const result=await elioClient.focusTimer({action,...options,...(active?{sessionId:active.id}:{})});if(current!==scope.current)return;apply(result.active,result.serverNow);window.dispatchEvent(new CustomEvent('sprach_db_change'));if(action==='finish'){toast.success('Server đã ghi nhận phiên hoàn tất.');if(active?.soundEnabled){const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;if(AudioContext){const ctx=new AudioContext(),osc=ctx.createOscillator(),gain=ctx.createGain();gain.gain.value=0.08;osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.2);osc.onended=()=>ctx.close();}}}}catch(e){if(current===scope.current)toast.error(e.message);}finally{if(current===scope.current){pending.current=false;setBusy(false);}}}
 return {enabled,active,remaining,ready,busy,action};
}
