import {createVocabularyBinding} from '../core/elio/vocabulary-binding.js';
import {toast} from 'sonner';
import {createElioClient} from '../core/elio/client.js';
import {createAuthBinding} from '../core/elio/auth-binding.js';
export const elioClient=createElioClient();
let binding=null,vocabulary=null;
export function installElioAuthentication(db){
 if(binding)return binding;
 binding=createAuthBinding({client:elioClient,legacy:{...db.auth},notify:()=>{vocabulary?.reset();if(vocabulary&&binding?.configuration().uiVocabularyEnabled)vocabulary.hydrate().catch(e=>toast.error(e.message));window.dispatchEvent(new CustomEvent('sprach_auth_change'));window.dispatchEvent(new CustomEvent('sprach_db_change'));}});
 db.auth=binding.auth;vocabulary=createVocabularyBinding({client:elioClient,legacy:{...db.vocabulary},isActive:()=>binding.isActive()&&binding.configuration().uiVocabularyEnabled===true,notify:({warnings=[]}={})=>{if(warnings.length)toast.warning(`${warnings.length} từ cũ thiếu ID nguồn; chỉ đọc, chưa ghi lịch ôn.`);window.dispatchEvent(new CustomEvent('sprach_db_change'));}});db.vocabulary=vocabulary.api;return binding;
}
export function elioAuthentication(){return binding;}
