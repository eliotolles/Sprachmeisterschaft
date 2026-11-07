import {activeCollectionId} from './collection-types.js';
import {elioClient,elioAuthentication} from './elio-auth-runtime.js';import {createExamBinding} from '../core/elio/exam-binding.js';
export const examCoreActive=()=>elioAuthentication()?.isActive()===true&&(elioAuthentication().configuration().uiExamEnabled===true||!!activeCollectionId());
export const newExamBinding=()=>createExamBinding({client:elioClient,isActive:examCoreActive});
