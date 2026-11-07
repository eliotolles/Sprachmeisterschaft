"""Compile the owner's split TELC source into ready-to-answer sections; no generated answer keys.
Inputs: extracted page text plus optional original page images produced by local OCR review.
"""
import argparse,hashlib,json,re
from telc_choices import source_choices
from pathlib import Path

def build(root,textdir,assetdir):
 records=[];exams=[];missing=[];sources=[]
 ranges={('Lesen',1):range(1,6),('Lesen',2):range(6,11),('Lesen',3):range(11,21),('Sprachbausteine',1):range(21,31),('Sprachbausteine',2):range(31,41),('Hoeren',1):range(41,46),('Hoeren',2):range(46,56),('Hoeren',3):range(56,61)}
 for folder in sorted(p for p in root.iterdir() if p.is_dir()):
  name=folder.name.split('_',1)[1];key=name.lower();exams.append({'key':key,'name':name});examitems=[]
  for skill in ['Lesen','Sprachbausteine','Hoeren','Schreiben']:
   pdf=next(folder.glob('*_'+skill+'.pdf'),None)
   if not pdf:missing.append({'exam':name,'skill':skill,'reason':'Không có PDF phần này trong ZIP nguồn.'});continue
   files=sorted(textdir.glob(pdf.stem+'__*.txt'),key=lambda p:int(p.stem.rsplit('__',1)[1]));pagecount=len(files)
   source={'filename':str(pdf.relative_to(root)),'sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pageCount':pagecount};sources.append(source)
   if skill=='Lesen':
    maps={1:[1,2],2:[3,4],3:[5,6]}
    if name=='ANDREAS2':maps={1:[1,2],3:[3,4]};missing.append({'exam':name,'skill':'Lesen Teil 2','reason':'Thiếu trong PDF nguồn.'})
    if name=='SOPHIE':maps={1:[1,2],2:[3,4],3:[6,7],22:[3,5]}
   elif skill=='Sprachbausteine':
    maps={1:[1],2:[2]} if name!='ANDREAS2' else {2:[1]}
    if name=='ANDREAS2':missing.append({'exam':name,'skill':'Sprachbausteine Teil 1','reason':'Thiếu trong PDF nguồn.'})
   elif skill=='Hoeren':
    maps={1:[1],2:[2],3:[3]} if name!='ANDREAS2' else {2:[1],3:[2]}
    if name=='ANDREAS2':missing.append({'exam':name,'skill':'Hören Teil 1','reason':'Thiếu trong PDF nguồn.'})
   else:maps={1:list(range(1,pagecount+1))}
   for variant,pages in maps.items():
    part=2 if variant==22 else variant
    selected=[(i,(textdir/(pdf.stem+f'__{i}.txt')).read_text()) for i in pages if (textdir/(pdf.stem+f'__{i}.txt')).exists()]
    content='\n\n'.join('Trang '+str(i)+'\n'+t.strip() for i,t in selected)
    images=['/telc18/'+pdf.stem+f'__{i}.webp' for i,_ in selected if (assetdir/(pdf.stem+f'__{i}.webp')).exists()]
    kind={'Lesen':'reading','Sprachbausteine':'grammar','Hoeren':'listening','Schreiben':'writing'}[skill]
    title=name+' · '+{'Hoeren':'Hören'}.get(skill,skill)+(f' · Teil {part}' if skill!='Schreiben' else '')+(' · bản câu hỏi 2' if variant==22 else '')
    rid='telc18-'+key+'-'+kind+'-'+str(variant);itemid=rid+'-part'
    warnings=[]
    if images:warnings.append('Có trang dạng ảnh/OCR. Trang gốc được giữ kèm để đối chiếu; dùng ảnh gốc nếu OCR mờ hoặc sai ký tự.')
    if skill=='Hoeren':warnings.append('ZIP chỉ có câu hỏi nghe; chưa có audio hoặc transcript. Không suy đoán đáp án nghe khi thiếu dữ liệu.')
    if variant==22:warnings.append('Nguồn có hai bản câu hỏi Lesen Teil 2. Bản này giữ riêng, không trộn với bản đầu.')
    questions=[];optiontexts={}
    grammar_choices=source_choices(pdf,name,part,pages[0]-1) if skill=='Sprachbausteine' else {}
    if skill=='Lesen' and part==1:
     matches=list(re.finditer(r'(?m)^\s*[_\s]*([A-Ja-j])\s*[).|]\s*(.*)',selected[0][1]))
     for n,m in enumerate(matches):
      end=matches[n+1].start() if n+1<len(matches) else len(selected[0][1]);block=selected[0][1][m.start():end]
      value=re.sub(r'^\s*[_\s]*[A-Ja-j]\s*[).|]\s*','',block).strip().split('ABDELLAH')[0].strip();value=' '.join(value.split())
      if value:optiontexts[m.group(1).upper()]=value
    for num in ranges.get((skill,part),[]):
     if skill=='Lesen' and part==1:prompt=f'Text {num}';options=list('ABCDEFGHIJ');typ='matching'
     elif skill=='Lesen' and part==3:
      found=re.search(r'(?m)^\s*'+str(num)+r'\s*[.)]\s*(.*?)(?=\n\s*'+str(num+1)+r'\s*[.)]|\n\s*ABDELLAH|\Z)',content,re.S)
      prompt=' '.join(found.group(1).strip().split()) if found else f'Situation {num} · xem văn bản nguồn'
      options=list('ABCDEFGHIJKL')+['X'];typ='matching'
     elif skill=='Hoeren':
      found=re.search(r'(?m)^\s*'+str(num)+r'\s*[.)]\s*(.*?)(?=\n\s*'+str(num+1)+r'\s*[.)]|\n\s*ABDELLAH|\Z)',content,re.S)
      prompt=' '.join(found.group(1).strip().split()) if found else f'Aussage {num} · xem trang gốc';options=['+','-'];typ='choice'
     elif skill=='Sprachbausteine':prompt=f'Lücke {num}';options=list('ABC') if part==1 else list('ABCDEFGHIJKLMNO');typ='choice'
     else:
      found=re.search(r'(?m)^\s*'+str(num)+r'\s*[.)]\s*([^\n]*)',content)
      prompt=found.group(1).strip() if found else f'Aufgabe {num} · xem trang gốc';options=list('ABC');typ='choice'
     if name=='RITA' and skill=='Lesen':
      corrections={9:'Palmers Auto',11:'Ihre Bekannte ist Mitte dreißig und sucht einen Partner, mit dem sie regelmäßig ins Kino gehen kann.',12:'Sie wollen Ihren Garten verändern und suchen Beratung/Tipps.',13:'Der Sohn Ihre Freunde hat gerade das Abitur gemacht und sucht im Sommer für zwei Monate einen Job.',14:'Ihr Freund möchte im Nebenjob Gartenarbeiten übernehmen.',15:'Ihr 45-jähriger Onkel sucht eine Partnerin, mit der er zusammen verreisen kann.',16:'Sie möchten gern bei einem Film mitspielen und etwas Geld verdienen.',17:'Der Sohn Ihre Freunde interessiert sich für die Geschichte des Autos. Am Sonntag wollen Sie ihm etwas Interessantes machen.',18:'Sie suchen eine Stelle und brauchen Tipps für ihre Bewerbungen.',19:'Im Urlaub wollen Sie mit dem Auto eine Reise durch Deutschland machen und suchen ein passendes Angebot.',20:'Ihre Bekannte möchte lernen, wie sie kleine Reparaturen an ihrem Wagen selbst machen.'}
      prompt=corrections.get(num,prompt)
     questions.append({'id':'q'+str(num),'sourceNumber':num,'prompt':prompt,'type':typ,'options':options,'optionTexts':(grammar_choices.get(num,{}) if part==1 else grammar_choices) if skill=='Sprachbausteine' else optiontexts if skill=='Lesen' and part==1 else {'+':'Richtig','-':'Falsch'} if skill=='Hoeren' else {}})
    if skill=='Schreiben':questions=[{'id':'writing','sourceNumber':1,'prompt':'Schreiben Sie Ihre Antwort auf den Brief und bearbeiten Sie alle Punkte aus der Originalaufgabe.','type':'text','options':[]}]
    item={'id':itemid,'title':title,'level':'B1','exam':'telc','skill':'sprachbausteine' if skill=='Sprachbausteine' else kind,'teil':part,'content':content,'questions':questions,'sourceImages':images,'source':{**source,'pages':pages}}
    if kind=='grammar':item['exercises']=[]
    data={'id':rid,'name':title,'organizerId':'telc18-'+key,'items':[item],'warnings':warnings,'sourceBundle':'telc18-prepared-v1'}
    records.append({'id':rid,'kind':kind,'title':title,'data':data})
    if variant!=22:examitems.append(item)
  # All skills together form a separate exam workspace; variants remain in their own skill records.
  fullid='telc18-'+key+'-exam';warnings=['Đáp án và audio không có trong ZIP. Có thể bổ sung PDF đáp án sau; kết quả AI được ghi rõ là đề xuất.']+[m['skill']+': '+m['reason'] for m in missing if m['exam']==name]
  records.append({'id':fullid,'kind':'exam','title':name+' · TELC B1 · Đề tổng hợp','data':{'id':fullid,'name':name+' · TELC B1','organizerId':'telc18-'+key,'items':examitems,'warnings':warnings,'sourceBundle':'telc18-prepared-v1'}})
 missing.extend([{'exam':'Tất cả 18 đề','skill':'Sprechen','reason':'Không có phần Nói trong ZIP nguồn.'},{'exam':'Tất cả 18 đề','skill':'Audio / Đáp án','reason':'Không có file audio hoặc đáp án riêng trong ZIP nguồn.'}])
 return {'id':'telc18-prepared-v1','exams':exams,'records':records,'sources':sources,'missing':missing}
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--source',type=Path,required=True);parser.add_argument('--pages',type=Path,required=True);parser.add_argument('--assets',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();result=build(args.source,args.pages,args.assets);args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')));print(json.dumps({'exams':len(result['exams']),'sources':len(result['sources']),'records':len(result['records']),'questions':sum(len(i['questions']) for r in result['records'] if r['kind']!='exam' for i in r['data']['items']),'missing':result['missing']},ensure_ascii=False,indent=2))
