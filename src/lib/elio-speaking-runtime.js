import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createSpeakingBinding} from '../core/elio/speaking-binding.js';
export const speakingCoreActive=()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiSpeakingEnabled===true;
export const newSpeakingBinding=()=>createSpeakingBinding({client:elioClient,isActive:speakingCoreActive});
