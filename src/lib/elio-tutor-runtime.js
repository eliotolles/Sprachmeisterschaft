import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createTutorBinding} from '../core/elio/tutor-binding.js';
export const elioTutor=createTutorBinding({client:elioClient,isActive:()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiTutorEnabled===true});
