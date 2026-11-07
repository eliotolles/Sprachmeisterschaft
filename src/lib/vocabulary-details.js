// Lexical fields only: never copy ownership or review state from source metadata.
export function vocabularyDetails(word={}){
 let extra=word.extra||{};
 if(typeof word.extra_json==='string'){try{extra={...JSON.parse(word.extra_json),...extra};}catch{}}
 const sources=[word,extra];
 const get=(...keys)=>{for(const source of sources)for(const key of keys){const value=source?.[key];if(value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length))return value;}return '';};
 return {ai_fields:get('ai_fields'),english:get('english','en','meaning_en'),meaning_de:get('meaning_de','explanation_de','definition_de'),synonyms:get('synonyms','synonyme'),antonyms:get('antonyms'),phrases:get('phrases','collocations','chunks','chunk','fixed_phrases','fixed_phrases_collocations','feste_wendungen'),collocations:get('collocations','chunks','chunk','fixed_phrases','phrases'),plural:get('plural'),ipa:get('ipa','phonetic'),notes:get('notes','note'),du:get('du'),prateritum:get('prateritum','praeteritum'),partizip_ii:get('partizip_ii','participle'),auxiliary:get('auxiliary'),explanation_de:get('explanation_de','meaning_de')};
}
export function lexicalItems(value){if(Array.isArray(value))return value;if(typeof value==='string'&&value.trim())return [value];return [];}
