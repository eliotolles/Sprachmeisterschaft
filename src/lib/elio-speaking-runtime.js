import {activeCollectionId} from './collection-types.js';
import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createSpeakingBinding} from '../core/elio/speaking-binding.js';
export const speakingCoreActive=()=>elioAuthentication()?.isActive()===true&&(elioAuthentication().configuration().uiSpeakingEnabled===true||!!activeCollectionId());
export const newSpeakingBinding=()=>createSpeakingBinding({client:elioClient,isActive:speakingCoreActive});
