const coreError=(status,code,message)=>Object.assign(new Error(message),{status,code});
const kinds=['vocab','exam','listening','writing','speaking','reading','situation'];
const invalid=()=>coreError(400,'IMPORT_INPUT','Dữ liệu nhập chưa hợp lệ.');
const text=(s,max=10000)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
export function validateImport(kind,collection){
 if(!kinds.includes(kind)||!collection||!text(collection.id,256)||!text(collection.name,500)||!Array.isArray(collection.items)||!collection.items.length||collection.items.length>2000)throw invalid();
 const ids=new Set();for(const item of collection.items){if(!item||!text(item.id,256)||ids.has(item.id)||!['A1','A2','B1','B2','C1','C2'].includes(item.level))throw invalid();ids.add(item.id);
  if(kind==='vocab'){if(!text(item.de,1000)||!text(item.vi,2000))throw invalid();}
  else if(!text(item.title,500))throw invalid();
  if(kind==='listening'){
   if(item.url!==undefined){let u;try{u=new URL(item.url);}catch{throw invalid();}if(u.protocol!=='https:'||u.username||u.password)throw invalid();}
   if(item.cues!==undefined&&(!Array.isArray(item.cues)||item.cues.length>10000||!item.cues.every((c,i,a)=>text(c.text,1500)&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start&&(!i||c.start>=a[i-1].start))))throw invalid();
  }
  if(['writing','speaking','reading','situation'].includes(kind)&&!text(item.content,100000))throw invalid();
  if(kind==='exam'&&(!['reading','listening','writing','speaking'].includes(item.skill)||!['Goethe','telc','ÖSD','ECL'].includes(item.exam)))throw invalid();
 }
 if(new TextEncoder().encode(JSON.stringify(collection)).byteLength>1500000)throw coreError(413,'IMPORT_LIMIT','Chia tài liệu thành bộ nhỏ hơn.');
 return collection;
}
