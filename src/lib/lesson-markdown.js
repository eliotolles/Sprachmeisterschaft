// Safe lesson formatting: no raw HTML, scripts, images or external URLs.
export function inlineLesson(text) {
 return String(text).split(/(\*\*[^*\n]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|\x60[^\x60\n]+\x60)/g).filter(Boolean).map(value=>{
  if(value.startsWith('**')&&value.endsWith('**'))return {type:'strong',text:value.slice(2,-2)};
  if(value.startsWith('*')&&value.endsWith('*'))return {type:'em',text:value.slice(1,-1)};
  if(value.startsWith('\x60')&&value.endsWith('\x60'))return {type:'code',text:value.slice(1,-1)};
  return {type:'text',text:value};
 });
}
export function parseLessonMarkdown(value) {
 const lines=String(value||'').replace(/\r\n?/g,'\n').split('\n'),blocks=[];
 const cells=s=>s.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim());
 for(let i=0;i<lines.length;){
  const line=lines[i];if(!line.trim()){i++;continue;}
  const heading=/^(#{1,6})\s+(.+)$/.exec(line);
  if(heading){blocks.push({type:'heading',depth:heading[1].length,text:heading[2]});i++;continue;}
  if(line.includes('|')&&i+1<lines.length&&cells(lines[i+1]).every(x=>/^:?-{3,}:?$/.test(x))){
   const header=cells(line),rows=[];i+=2;while(i<lines.length&&lines[i].trim()&&lines[i].includes('|')){rows.push(cells(lines[i]));i++;}
   blocks.push({type:'table',header,rows});continue;
  }
  const list=/^\s*(?:[-*]\s+|\d+\.\s+)/;
  if(list.test(line)){const ordered=/^\s*\d+\./.test(line),items=[];while(i<lines.length&&list.test(lines[i])&&/^\s*\d+\./.test(lines[i])===ordered){items.push(lines[i].replace(list,''));i++;}blocks.push({type:ordered?'ol':'ul',items});continue;}
  const paragraphs=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^#{1,6}\s/.test(lines[i])&&!list.test(lines[i])&&!(lines[i].includes('|')&&i+1<lines.length&&cells(lines[i+1]).every(x=>/^:?-{3,}:?$/.test(x))))paragraphs.push(lines[i++]);
  blocks.push({type:'paragraph',text:paragraphs.join('\n')});
 }
 return blocks;
}
export function renderLessonMarkdown(React,value) {
 const h=React.createElement,inline=text=>inlineLesson(text).map((p,i)=>p.type==='text'?p.text:h(p.type,{key:i},p.text));
 return h('div',{className:'space-y-4 whitespace-normal'},parseLessonMarkdown(value).map((b,i)=>{
  if(b.type==='heading')return h('h'+Math.min(6,b.depth+2),{key:i,className:'font-semibold text-foreground text-base pt-2'},inline(b.text));
  if(b.type==='table')return h('div',{key:i,className:'overflow-x-auto'},h('table',{className:'w-full border-collapse text-left text-xs'},h('thead',null,h('tr',null,b.header.map((t,j)=>h('th',{key:j,scope:'col',role:'columnheader',className:'border border-border bg-muted/40 p-2 font-semibold'},inline(t))))),h('tbody',null,b.rows.map((row,k)=>h('tr',{key:k},b.header.map((_,j)=>h('td',{key:j,className:'border border-border p-2 align-top'},inline(row[j]||''))))))));
  if(b.type==='ul'||b.type==='ol')return h(b.type,{key:i,className:(b.type==='ol'?'list-decimal':'list-disc')+' pl-5 space-y-2'},b.items.map((t,j)=>h('li',{key:j},inline(t))));
  return h('p',{key:i,className:'leading-relaxed'},inline(b.text));
 }));
}
