import {createPersonalBinding} from '../core/elio/personal-binding.js';
import {createVocabularyBinding} from '../core/elio/vocabulary-binding.js';
import {toast} from 'sonner';
import {createElioClient} from '../core/elio/client.js';
import {createAuthBinding} from '../core/elio/auth-binding.js';
export const elioClient=createElioClient();
let binding=null,vocabulary=null,personal=null;
export function installElioAuthentication(db){
 if(binding)return binding;
 binding=createAuthBinding({client:elioClient,legacy:{...db.auth},notify:()=>{personal?.reset();if(personal&&binding?.configuration().uiPersonalEnabled)personal.hydrate().catch(e=>{if(e.code!=='ACCOUNT_CHANGED')toast.error(e.message);});vocabulary?.reset();if(vocabulary&&binding?.configuration().uiVocabularyEnabled)vocabulary.hydrate().catch(e=>toast.error(e.message));window.dispatchEvent(new CustomEvent('sprach_auth_change'));window.dispatchEvent(new CustomEvent('sprach_db_change'));}});
 window.addEventListener('sprach_core_vocabulary_changed',()=>{if(vocabulary&&binding?.isActive()&&binding.configuration().uiVocabularyEnabled){vocabulary.reset();vocabulary.hydrate().catch(e=>{if(e.code!=='ACCOUNT_CHANGED')toast.error(e.message);});}});
 window.addEventListener('sprach_core_imported',()=>{if(vocabulary&&binding?.isActive()&&binding.configuration().uiVocabularyEnabled)vocabulary.hydrate().catch(error=>toast.error(error.message));});
 db.auth=binding.auth;vocabulary=createVocabularyBinding({client:elioClient,legacy:{...db.vocabulary},isActive:()=>binding.isActive()&&binding.configuration().uiVocabularyEnabled===true,notify:({warnings=[]}={})=>{if(warnings.length)toast.warning(`${warnings.length} từ cũ thiếu ID nguồn; chỉ đọc, chưa ghi lịch ôn.`);window.dispatchEvent(new CustomEvent('sprach_db_change'));}});db.vocabulary=vocabulary.api;personal=createPersonalBinding({client:elioClient,legacy:{learnerProfile:{...db.learnerProfile},notes:{...db.notes}},isActive:()=>binding.isActive()&&binding.configuration().uiPersonalEnabled===true,notify:()=>window.dispatchEvent(new CustomEvent('sprach_db_change'))});db.learnerProfile=personal.api.learnerProfile;db.notes=personal.api.notes;return binding;
}
export function elioAuthentication(){return binding;}

export const personalCoreActive=()=>binding?.isActive()===true&&binding.configuration().uiPersonalEnabled===true;
