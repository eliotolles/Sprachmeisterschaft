import pdfplumber,re
from pathlib import Path

def cloze(path,page_index=0):
 with pdfplumber.open(path) as d:
  p=d.pages[page_index];words=p.extract_words();anchors=[w for w in words if re.fullmatch(r'2[1-9]\.|30\.',w['text']) and w['top']>p.height*.45];xs=sorted(set(round(w['x0']/15)*15 for w in anchors));result={}
  for q in anchors:
   num=int(q['text'][:-1]);x=q['x0'];same=[a for a in anchors if abs(a['x0']-x)<15 and a['top']>q['top']+20];bottom=min([a['top']-10 for a in same]or[p.height-35]);right=min([a['x0']-6 for a in anchors if a['x0']>x+50]or[p.width-20]);cell=[w for w in words if x+15<w['x0']<right and q['top']-10<w['top']<bottom];labels=[w for w in cell if w['text'] in ['A','B','C']];texts={}
   lx=min([w['x0'] for w in labels]or[x+20]);vals=[w for w in cell if w['text'] not in ['A','B','C'] and w['x0']>lx+6 and w['top']<q['top']+68]
   rows=[]
   for w in sorted(vals,key=lambda w:(w['top'],w['x0'])):
    if not rows or abs(w['top']-rows[-1][0]['top'])>9:rows.append([w])
    else:rows[-1].append(w)
   if len(rows)==3:texts={key:' '.join(w['text'] for w in sorted(row,key=lambda w:w['x0'])) for key,row in zip('ABC',rows)}
   if all(texts.get(k) for k in ['A','B','C']):result[num]=texts
  return result

def word_bank(path,page_index):
 with pdfplumber.open(path) as doc:
  page=doc.pages[page_index];text=page.extract_text(layout=True) or ''
  pairs=re.findall(r'(?<![\w])([a-o])\s+([A-ZÄÖÜẞ][A-ZÄÖÜẞäöüß-]*)',text)
  found={key.upper():value for key,value in pairs}
  return found if len(found)==15 else {}

# Transcribed against the original page images, not inferred answers.
SCANNED_CLOZE={
 'SONJA3':['geschah|geschehen|geschieht','dich|dir|Du','halten|wären|wurden','lange|langem|langer','er|ich|man','als|damit|ob','über|um|vor','dem|den|denen','getroffen|treffe|treffen','bis|in|an'],
 'RITA':['dafür|damit|davon','bin|habe|war','doch|nur|schon','gepasst|pasen|passt','an|bei|zu','beide|beiden|beides','ersten|erster|erstes','im|in|ins','Am besten|Besser|Gut','geht|geht’s|ging']}
SCANNED_BANK={
 'SONJA3':['ALS','AUF','DESWEGEN','MÖCHTE','NENNT','SAGT','SOLLTE','SONDERN','STATT','WAS','WEIL','WELCHEN','WICHTIGEN','WÜRDE','ZUM'],
 'RITA':['DER','DIE','ERST','GEEIGNET','GERNE','HÄTTE','IN','MUSS','NACH','NOCH','SCHON','WANN','WÄRE','WENN','WO']}
def source_choices(path,name,part,page_index):
 if name in SCANNED_CLOZE:
  if part==1:return {n+21:dict(zip('ABC',row.split('|'))) for n,row in enumerate(SCANNED_CLOZE[name])}
  return dict(zip('ABCDEFGHIJKLMNO',SCANNED_BANK[name]))
 if part==2:return word_bank(path,page_index)
 result=cloze(path,page_index)
 if name=='SOPHIE':result[23]={'A':'dauern','B':'dauert','C':'gedauert'}
 if name=='NICOLE':result.update({27:{'A':'für','B':'von','C':'wegen'},28:{'A':'gezeigt','B':'zeigen','C':'zeigt'}})
 return result
