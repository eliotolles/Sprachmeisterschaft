import {elioClient,elioAuthentication} from './elio-auth-runtime.js';import {createImportBinding} from '../core/elio/import-binding.js';
export const elioImport=createImportBinding({client:elioClient,isActive:()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiImportEnabled===true});
