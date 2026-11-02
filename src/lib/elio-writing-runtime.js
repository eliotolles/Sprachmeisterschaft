import {elioClient,elioAuthentication} from './elio-auth-runtime.js';import {createWritingBinding} from '../core/elio/writing-binding.js';
export const elioWriting=createWritingBinding({client:elioClient,isActive:()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiWritingEnabled===true});
