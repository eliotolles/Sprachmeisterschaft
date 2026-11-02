// Map server-owned tutor turns onto the existing chat message contract.
export function createTutorBinding({client,isActive}){
 let owner=null,epoch=0,loaded=false,session=null;
 const fail=()=>Object.assign(new Error('Tài khoản đã thay đổi; không hiển thị hội thoại cũ.'),{code:'ACCOUNT_CHANGED'});
 function scope(){const id=client.getUser()?.id||null;if(owner!==id){owner=id;epoch++;loaded=false;session=null;}return id;}
 function messages(){return(session?.messages||[]).map(m=>({role:m.role,content:m.text}));}
 function accept(result,id,current){if(client.getUser()?.id!==id||current!==epoch)throw fail();if(!result?.session||!Array.isArray(result.session.messages)||!result.session.messages.every(m=>['user','assistant'].includes(m.role)&&typeof m.text==='string'))throw Error('Phản hồi gia sư không hợp lệ.');session=structuredClone(result.session);loaded=true;return messages();}
 async function load(){const id=scope(),current=epoch;if(!isActive()||!id)return[];if(loaded)return messages();const state=await client.loadState(['sprach_core_tutor_sessions']);if(client.getUser()?.id!==id||current!==epoch)throw fail();const value=state.sprach_core_tutor_sessions?.value||{sessions:[]};if(!Array.isArray(value.sessions))throw Error('Lịch sử gia sư chưa đọc được; không ghi đè.');session=value.sessions.find(s=>s.id===value.activeSessionId)||value.sessions.at(-1)||null;loaded=true;return messages();}
 return {isActive,load,
  async reply(text,level,language='vi',options){const id=scope(),current=epoch;if(!isActive()||!id)throw fail();if(!loaded)await load();if(session&&(session.level!==level||session.language!==language))accept(await client.newTutorThread({level,language}),id,current);const result=await client.tutorReply({text,level,language,...(session?{sessionId:session.id}:{})},options);return accept(result,id,current);},
  async startNew(level,language='vi'){const id=scope(),current=epoch;if(!isActive()||!id)throw fail();return accept(await client.newTutorThread({level,language}),id,current);},
  reset(){owner=null;epoch++;loaded=false;session=null;}};
}
