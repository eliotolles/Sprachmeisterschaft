import {elioClient,elioAuthentication} from './elio-auth-runtime.js';
import {createGrammarBinding} from '../core/elio/grammar-binding.js';
export const grammarCoreActive=()=>elioAuthentication()?.isActive()===true&&elioAuthentication().configuration().uiGrammarEnabled===true;
export const newGrammarBinding=()=>createGrammarBinding({client:elioClient,isActive:grammarCoreActive});
