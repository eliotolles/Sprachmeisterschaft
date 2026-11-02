import {elioClient,elioAuthentication} from './elio-auth-runtime.js';import {createAIAdminBinding} from '../core/elio/ai-admin-binding.js';
let binding=null;
export function installAIAdminRuntime(db){if(!binding){binding=createAIAdminBinding({client:elioClient,legacy:{...db.aiConfig},isActive:()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiAIAdminEnabled===true,notify:()=>window.dispatchEvent(new CustomEvent('sprach_db_change'))});db.aiConfig=binding.api;}return binding;}
export const elioAIAdmin=()=>binding;
