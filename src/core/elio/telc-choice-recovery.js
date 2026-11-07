import corpus from './data/telc18-prepared.json' with {type:'json'};
// Source choice recovery adapted from the owner's ElioEinfachlernen TelcExam module.
export function sourceChoices(task,question){
  const labels=question.options||[];if(labels.length!==3||labels.some(v=>!/^[abc]$/i.test(v)))return null;
  const number=Number(question.sourceNumber||question.number||String(question.prompt||'').match(/^(?:\s*|Lücke\s+)(\d+)/i)?.[1]);if(!Number.isInteger(number))return null;
  const clean=line=>line.trim().replace(/^\*\*|\*\*$/g,'');
  const plain=q=>String(q.prompt||q.question||'').replace(/^\s*\d+[.)]\s*/,'').trim().replace(/\s+/g,' ');
  const lines=String(task.content||'').split(/\r?\n/).map(clean),numbered=new RegExp('^\\s*'+number+'[.)]\\s+');
  let start=lines.findIndex(line=>numbered.test(line));
  // Some legacy imports lost list markers while retaining every source line.
  // Require an exact stem prefix from the original question; never guess text.
  if(start<0)for(let i=0;i<lines.length;i++)if(lines[i].length>=10&&plain(question).startsWith(lines[i].replace(/\s+/g,' ')))start=i;
  if(start<0)return null;
  const stem=lines[start].replace(numbered,'').trim(),other=(task.questions||[]).filter(q=>q!==question&&plain(q)!==plain(question));
  const body=[];for(let i=start+1;i<lines.length;i++){const line=lines[i];if(/^\d{1,3}[.)]\s+|^---$|^#{1,3}\s|^Trang\s+\d+/i.test(line)||line.length>=10&&other.some(q=>plain(q).startsWith(line.replace(/\s+/g,' '))))break;if(line)body.push(line);}
  const texts={},order=[],pending=[];let active=null,invalid=false;
  const put=(label,text)=>{label=label.toUpperCase();if(texts[label]||!text.trim()){invalid=true;return;}texts[label]=text.trim();order.push(label);};
  const flush=()=>{if(pending.length){if(!active){invalid=true;return;}texts[active]+=' '+pending.join(' ');pending.length=0;}};
  for(const line of body){
   const before=line.match(/^([abc])[.)·:]?\s+(.+)$/i),after=line.match(/^(.+?)\s+([abc])[.)]?$/i),single=line.match(/^([abc])[.)]?$/i);
   if(before){flush();put(before[1],before[2]);active=before[1].toUpperCase();}
   else if(after){const text=active?(flush(),after[1]):[...pending,after[1]].join(' ');pending.length=0;put(after[2],text);active=null;}
   else if(single){put(single[1],pending.join(' '));pending.length=0;active=null;}
   else pending.push(line);
  }
  flush();if(invalid||order.join('')!=='ABC'||!stem)return null;
  return {prompt:stem,optionTexts:Object.fromEntries(labels.map(label=>[label,texts[label.toUpperCase()]])),sourceNumber:number};
 }

const normalize=value=>String(value||'').normalize('NFC').toLocaleLowerCase('de').replace(/[^\p{L}]/gu,'');
const originals=corpus.records.filter(row=>row.kind==='grammar').map(row=>{const section=row.data.items[0],body=normalize(section.content);return {section,signatures:[200,400,600,800,1000].map(start=>body.slice(start,start+100)).filter(part=>part.length===100)};});
export function recoverChoiceTexts(section,question,source=''){
 if(question.optionTexts&&question.options?.every(option=>question.optionTexts[option]))return question.optionTexts;
 const linear=sourceChoices({content:section.content||source,questions:section.questions},question);if(linear)return linear.optionTexts;
 const number=Number(question.sourceNumber||question.number||question.prompt?.match(/Lücke\s+(\d+)/i)?.[1]);if(!Number.isInteger(number))return question.optionTexts||{};
 const text=normalize((section.content||'')+' '+source),matches=originals.filter(entry=>entry.signatures.filter(signature=>text.includes(signature)).length>=2).map(entry=>entry.section.questions.find(q=>q.sourceNumber===number)?.optionTexts).filter(Boolean);
 if(matches.length&&matches.every(value=>JSON.stringify(value)===JSON.stringify(matches[0])))return matches[0];
 return question.optionTexts||{};
}
