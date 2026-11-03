// IDs ported from ElioEinfachlernen-/public/js/ai-models.js (source reviewed 2026-10-18).
// Ranking hints only: never add a model absent from the authenticated live catalog.
export const ELIO_MODEL_HINTS=Object.freeze({
 gemini:['gemini-flash-latest','gemini-flash-lite-latest','gemini-3.5-flash-lite','gemini-3.8-flash'],
 groq:['openai/gpt-oss-20b','openai/gpt-oss-120b','qwen/qwen3.8-27b'],
 openrouter:['openrouter/free','google/gemma-4-31b-it:free','nvidia/nemotron-3.5-super-vl:free','nvidia/nemotron-3-super-120b-a12b:free']
});
export function recommendLiveModels(models=[],freeFirst=true){
 const hint=m=>{const n=ELIO_MODEL_HINTS[m.provider]?.indexOf(m.id)??-1;return n<0?1000:n;};
 return [...models].sort((a,b)=>(freeFirst?Number(b.pricing?.isFree===true)-Number(a.pricing?.isFree===true):0)||(Date.parse(b.releaseDate)||0)-(Date.parse(a.releaseDate)||0)||hint(a)-hint(b)||String(a.name||a.id).localeCompare(String(b.name||b.id))).slice(0,8);
}
