import {createElioClient} from '../core/elio/client.js';
import {createAuthBinding} from '../core/elio/auth-binding.js';
export const elioClient=createElioClient();
let binding=null;
export function installElioAuthentication(db){
 if(binding)return binding;
 binding=createAuthBinding({client:elioClient,legacy:{...db.auth},notify:()=>{window.dispatchEvent(new CustomEvent('sprach_auth_change'));window.dispatchEvent(new CustomEvent('sprach_db_change'));}});
 db.auth=binding.auth;return binding;
}
export function elioAuthentication(){return binding;}
