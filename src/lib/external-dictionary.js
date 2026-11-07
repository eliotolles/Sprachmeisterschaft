import {parseVerbOverview} from './participle-dictionary.js';
export function dictionaryTerm(input) {
 const word=String(input||'').normalize('NFC').trim();
 if(!/^[\p{L}][\p{L}\p{M} -]{0,79}$/u.test(word)) throw new Error('Nhập một từ hoặc cụm từ, tối đa 80 ký tự.');
 return word;
}
export function plainWiki(value){
 return value.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/g,'').replace(/<[^>]+>/g,'').replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g,'$1').replace(/\{\{[^{}]*\}\}/g,'').replace(/'{2,}/g,'').replace(/&nbsp;/g,' ').trim();
}
export function parseDictionaryText(text,language){
 let section='';
 if(language==='vi'){
  const start=text.search(/\{\{-(?:deu|de)-\}\}/);
  if(start<0)return {definitions:[],ipa:[]};
  section=text.slice(start).split(/\n\{\{-(?!deu-|de-)[a-z]{2,3}-\}\}/)[0];
 }else{
  const start=text.search(/^==[^=\n]*\{\{Sprache\|Deutsch\}\}[^\n]*==/m);
  if(start<0)return {definitions:[],ipa:[]};
  section=text.slice(start).split(/\n==[^=]/)[0];
 }
 const definitions=(language==='vi'?[...section.matchAll(/^#(?![:*#])\s*(.+)$/gm)].map(m=>plainWiki(m[1])):[...section.matchAll(/\{\{Bedeutungen\}\}([\s\S]*?)(?=\n\{\{|$)/g)].flatMap(m=>[...m[1].matchAll(/^:\[([^\]]+)\]\s*(.+)$/gm)].map(n=>'['+n[1]+'] '+plainWiki(n[2])))).filter(v=>v&&!/[{}]/.test(v));
 const ipa=[...section.matchAll(language==='vi'?/\{\{IPA4\|de\|([^}|]+)/g:/\{\{Lautschrift\|([^}|]+)/g)].map(m=>m[1]);
 return {definitions:[...new Set(definitions)],ipa:[...new Set(ipa)]};
}
export async function handleDictionaryLookup(request,fetcher=fetch){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600'};
 const send=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(request.method!=='GET')return send({error:'Method not allowed'},405);
 let word;try{word=dictionaryTerm(new URL(request.url).searchParams.get('word'));}catch(e){return send({error:e.message},400);}
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  async function lookup(language,title){
   const url=new URL('https://'+language+'.wiktionary.org/w/api.php');url.search=new URLSearchParams({action:'parse',page:title,prop:'wikitext',format:'json',redirects:'1'});
   const response=await fetcher(url,{signal:controller.signal,headers:{'User-Agent':'Sprachmeisterschaft/1.0 (https://github.com/eliotolles/Sprachmeisterschaft)'}});
   if(!response.ok)throw Error('upstream');
   const body=await response.json(),text=body.parse?.wikitext?.['*']||'';
   return {language,title:body.parse?.title||title,...parseDictionaryText(text,language),verbs:language==='de'?parseVerbOverview(text,title):[],source:'https://'+language+'.wiktionary.org/wiki/'+encodeURIComponent(body.parse?.title||title)};
  }
  let sources=await Promise.allSettled(['vi','de'].map(lang=>lookup(lang,word)));
  let entries=sources.filter(r=>r.status==='fulfilled').map(r=>r.value);
  if(!entries.some(e=>e.definitions.length||e.verbs.length)&&word[0]===word[0].toLocaleLowerCase('de')){
   const capital=word[0].toLocaleUpperCase('de')+word.slice(1);
   sources=await Promise.allSettled(['vi','de'].map(lang=>lookup(lang,capital)));
   entries=sources.filter(r=>r.status==='fulfilled').map(r=>r.value);
  }
  if(!entries.length)return send({error:'Không kết nối được kho từ điển. Hãy thử lại.'},503);
  return send({word,entries:entries.filter(e=>e.definitions.length||e.verbs.length),partial:sources.some(r=>r.status==='rejected'),license:'CC BY-SA 4.0'});
 }finally{clearTimeout(timer);}
}
