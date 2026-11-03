import {elioClient,elioAuthentication} from './elio-auth-runtime.js';import {createProgressBinding} from '../core/elio/progress-binding.js';
export const progressCoreActive=()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiProgressEnabled===true;
export const newProgressBinding=()=>createProgressBinding({client:elioClient,isActive:progressCoreActive});
