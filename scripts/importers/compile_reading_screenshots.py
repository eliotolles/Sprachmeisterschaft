"""Prepare the owner's screenshot exams, preserving exact visible questions as image crops.
No answer keys are inferred. Case-sensitive footer names and distinct variants stay separate.
"""
from pathlib import Path
from PIL import Image
import base64,hashlib,io,json,re,unicodedata
NAMES={
 'tei_1':['Đề mới TELC 1','Đề mới TELC 2','Đề mới TELC 3','Mara','Alicia','Moritz','Karla','Miroslav','Rita','Corina','Alex und Cora','SONJA3','Paul','JAN','TAMARA/JAKOB','Viktor','THOMAS','JENNIFER','VERA','VERA','CAROLINA','IRIS','ANNIKA2','Annika1','Andreas 2','ANDREAS','Nicole','Nadia','Jan','EVA','Petra'],
 'tei_2':['Đọc bổ sung 3','Đề mới TELC 2','Đề mới TELC 1','Mara','Alicia','Moritz','Karla','Miroslav','Rita','Corina','SONJA3','Paul','JAN','TAMARA/JAKOB','Viktor','THOMAS','JENNIFER','VERA','CAROLINA','IRIS','ANNIKA2','Annika1','Andreas 2','ANDREAS','Nicole','Nadja/Claudia','Jan','EVA1'],
 'teil_3':['Đề mới TELC 1','Mara','Alicia','Moritz','Karla','Miroslav','Rita','Corina','Alex und Cora','SONJA3','Paul','JAN','TAMARA/JAKOB','Viktor','THOMAS','JENNIFER','VERA','CAROLINA','IRIS','ANNIKA2','Annika1','Andreas 2','ANDREAS','Nicole','Nadja/Claudia','Jan','EVA1','Petra']}
PARTS={'tei_1':1,'tei_2':2,'teil_3':3}
def key(name):return hashlib.sha256(unicodedata.normalize('NFC',name).encode()).hexdigest()[:18]
def picture(im):
 b=io.BytesIO();im.convert('RGB').save(b,format='WEBP',quality=83,method=4)
 return 'data:image/webp;base64,'+base64.b64encode(b.getvalue()).decode()
def blue_rows(im,part):
 x=1120; spans=[];start=None
 for y in range(330,1083):
  r,g,b=im.getpixel((x,y))[:3];yes=b-r>25 and b>130 and r<180 and g<195
  if yes and start is None:start=y
  if not yes and start is not None:
   if y-start>=25:spans.append((start,y))
   start=None
 if start is not None and 1083-start>=25:spans.append((start,1083))
 expected=5 if part==2 else 10
 if len(spans)!=expected:raise ValueError(f'Cannot verify all {expected} original question cards: {spans}')
 return [{'y':a-330,'height':b-a} for a,b in spans]
def clean(s):return re.sub(r'\s+',' ',s).strip()
def build(root):
 manifest=json.loads((root/'manifest.json').read_text());folders={};records={};issues=[]
 for row in manifest:
  part=PARTS[row['part']];name=NAMES[row['part']][row['index']];slug=key(name);cid='reading-20261107-'+slug
  folders[cid]={'id':cid,'name':name,'skill':'reading','visibility':'public','sourceBundle':'reading-screenshots-20261107','createdAt':'2026-11-07T16:40:00Z'}
  path=Path(row['path']);im=Image.open(path).convert('RGB');stem=row['part']+'_'+str(row['index']).zfill(2)
  text=(root/'ocr'/(stem+'_left0.txt')).read_text() if (root/'ocr'/(stem+'_left0.txt')).exists() else ''
  if part==3:text+='\n\n'+(root/'ocr'/(stem+'_left1.txt')).read_text() if (root/'ocr'/(stem+'_left1.txt')).exists() else ''
  right=(root/'ocr'/(stem+'_right.txt')).read_text();rid=cid+'-teil-'+str(part);itemid=rid+'-source'
  if rid in records:
   # Two VERA photographs show different scroll positions. Preserve both, never discard one.
   records[rid]['data']['items'][0]['sourceImages'].append(picture(im.crop((31,330,1247,1083))))
   records[rid]['data']['items'][0]['content']+='\n\nẢnh nguồn bổ sung:\n'+text
   records[rid]['data']['sourceFiles'].append(path.name);records[rid]['data']['sourceSha256'].append(hashlib.sha256(path.read_bytes()).hexdigest());continue
  warnings=['Đề được nhập từ ảnh bạn cung cấp. Ảnh gốc là nguồn đối chiếu chính; văn bản OCR để hỗ trợ tra từ có thể sai ký tự.','Nguồn không kèm đáp án; chưa có đáp án chính thức.']
  item={'id':itemid,'title':name+' · Lesen · Teil '+str(part),'level':'B1','exam':'telc','skill':'reading','content':(text.strip() or 'Đọc nội dung đầy đủ trong ảnh nguồn đi kèm.')+'\n\nFragen / Überschriften (OCR để đối chiếu ảnh):\n'+right,'sourceImages':[picture(im.crop((31,330,1247 if part==1 else 1097,1083)))],'questions':[]}
  labels=list('ABCDEFGHIJ') if part==1 else list('ABC') if part==2 else list('ABCDEFGHIJKL')+['X']
  ranges=range(1,6) if part==1 else range(6,11) if part==2 else range(11,21)
  if part==1:
   item['choiceBankImage']=picture(im.crop((1257,330,1888,1083)))
   # Do not use unreliable OCR labels as authoritative heading text.
   for number in ranges:item['questions'].append({'id':str(number),'sourceNumber':number,'prompt':'Text '+str(number)+' · chọn tiêu đề trong bảng gốc A–J','type':'matching','options':labels})
  else:
   item['questionSheet']={'image':picture(im.crop((1110,330,1888,1083))),'width':778,'height':753}
   boxes=blue_rows(im,part)
   for number,box in zip(ranges,boxes):
    # The exact stem and every option are displayed from the source crop, avoiding fabricated OCR repairs.
    item['questions'].append({'id':str(number),'sourceNumber':number,'prompt':'Aufgabe '+str(number),'type':'choice' if part==2 else 'matching','options':labels,'sourceBounds':box})
  record={'id':rid,'kind':'reading','title':item['title'],'level':'B1','public':1,'data':{'id':rid,'name':item['title'],'type':'reading','organizerId':cid,'sourceBundle':'reading-screenshots-20261107','sourceFiles':[path.name],'sourceSha256':[hashlib.sha256(path.read_bytes()).hexdigest()],'prepared':True,'warnings':warnings,'items':[item]}}
  records[rid]=record
 result={'id':'reading-screenshots-20261107','folders':list(folders.values()),'records':list(records.values()),'issues':issues}
 for folder in result['folders']:
  parts=sorted(int(r['id'].rsplit('-',1)[1]) for r in result['records'] if r['data']['organizerId']==folder['id']);folder['availableParts']=parts
  if parts!=[1,2,3]:issues.append({'name':folder['name'],'availableParts':parts,'missingParts':[p for p in [1,2,3] if p not in parts]})
 grouped=[]
 for folder in result['folders']:
  parts=sorted([r for r in result['records'] if r['data']['organizerId']==folder['id']],key=lambda r:int(r['id'].rsplit('-',1)[1]));rid=folder['id']+'-lesen'
  warnings=list(dict.fromkeys(w for r in parts for w in r['data']['warnings']))
  missing=[p for p in [1,2,3] if p not in folder['availableParts']]
  if missing:warnings.append('ZIP nguồn chưa có Teil '+', '.join(map(str,missing))+' của đúng tên bộ này; không ghép với bộ tên khác.')
  grouped.append({'id':rid,'kind':'reading','title':folder['name']+' · Lesen','level':'B1','public':1,'data':{'id':rid,'name':folder['name']+' · Lesen','type':'reading','organizerId':folder['id'],'sourceBundle':'reading-screenshots-20261107','prepared':True,'availableParts':folder['availableParts'],'sourceFiles':[f for r in parts for f in r['data']['sourceFiles']],'sourceSha256':[f for r in parts for f in r['data']['sourceSha256']],'warnings':warnings,'items':[i for r in parts for i in r['data']['items']]}})
 result['records']=grouped;return result
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();v=build(a.root);a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(v,ensure_ascii=False,separators=(',',':')))
 print(json.dumps({'folders':len(v['folders']),'records':len(v['records']),'questions':sum(len(i['questions']) for r in v['records'] for i in r['data']['items']),'bytes':a.output.stat().st_size,'incomplete':v['issues']},ensure_ascii=False))
