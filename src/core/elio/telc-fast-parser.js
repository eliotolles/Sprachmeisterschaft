// Deterministic TELC profile: recognize complete numbered sections; otherwise defer to reviewed AI extraction.
export function fastTelcSections(source,title,kind){
 if(kind==='writing'&&/(?:Schreiben Sie|Antworten Sie)/i.test(source))return [{id:'writing-source',title,skill:'writing',content:source,questions:[{id:'writing-source:1',number:'1',prompt:'Schreiben Sie Ihre Antwort gemäß der Originalaufgabe.',type:'text',options:[]}]}];
 const headings=[...source.matchAll(/(Leseverstehen|Hörverstehen|Sprach[a-zäöüß]*steine)[,\s]*Teil\s*([123])/giu)];
 if(!headings.length)return null;
 const groups=new Map();for(let i=0;i<headings.length;i++){const h=headings[i],family=/^Lese/i.test(h[1])?'reading':/^Hör/i.test(h[1])?'listening':'sprachbausteine',part=Number(h[2]),id=family+':'+part;if(!groups.has(id))groups.set(id,{id,title:title+' · '+h[1]+' · Teil '+part,skill:family,part,content:'',questions:[]});groups.get(id).content+=source.slice(h.index,headings[i+1]?.index??source.length)+'\n';}
 const sections=[];
 for(const section of groups.values()){
  const range=section.skill==='reading'?{1:[1,5],2:[6,10],3:[11,20]}[section.part]:section.skill==='listening'?{1:[41,45],2:[46,55],3:[56,60]}[section.part]:{1:[21,30],2:[31,40]}[section.part];if(!range)return null;
  for(let n=range[0];n<=range[1];n++){
   const pattern=section.skill==='sprachbausteine'?new RegExp('\\(\\s*'+n+'\\s*\\)'):new RegExp('(?:^|\\n)\\s*'+n+'\\s*[.)]\\s*([^\\n]*)','g');
   const matches=[...section.content.matchAll(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g'))];if(matches.length!==1)return null;
   const options=section.skill==='listening'?['+','-']:section.skill==='sprachbausteine'?(section.part===1?[...'ABC']:[...'ABCDEFGHIJKLMNO']):section.part===1?[...'ABCDEFGHIJ']:section.part===2?[...'ABC']:[...'ABCDEFGHIJKL','X'];
   section.questions.push({id:section.id+':'+n,number:String(n),prompt:section.skill==='sprachbausteine'?'Lücke '+n:section.skill==='reading'&&section.part===1?'Text '+n:matches[0][1]?.trim()||'Aufgabe '+n,type:section.skill==='reading'&&section.part!==2?'matching':'choice',options,...(section.skill==='listening'?{optionTexts:{'+':'Richtig','-':'Falsch'}}:{})});
  }
  delete section.part;sections.push(section);
 }
 return sections;
}
