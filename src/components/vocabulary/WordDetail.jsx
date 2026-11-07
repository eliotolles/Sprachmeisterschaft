import {vocabularyDetails,lexicalItems} from '@/lib/vocabulary-details';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { elioClient } from '@/lib/elio-auth-runtime';
import { db } from '@/lib/db';
import { WORDS } from '@/data/vocabulary';
import { mapSharedElioCard } from '@/lib/shared-vocabulary';

const normalize = value => String(value ?? '').normalize('NFC').trim().toLocaleLowerCase('de');
const lemma = value => normalize(value).replace(/^(der|die|das) /, '');
const cache = new Map();
if (typeof window !== 'undefined') window.addEventListener('sprach_auth_change', () => cache.clear());

async function lookup(token) {
  const owner = db.auth.getUser()?.id;
  const key = JSON.stringify([owner, normalize(token), 'vi']);
  if (cache.has(key)) return cache.get(key);
  const matches = row => [row.german, row.plural, row.du, row.prateritum, row.partizip_ii].some(value => value && lemma(value) === lemma(token));
  let word = db.vocabulary.findMany().find(row => row.vietnamese && matches(row))
    || WORDS.find(row => row.vietnamese && matches(row));
  if (!word && db.vocabulary.isCore?.()) {
    const rows = await elioClient.vocabulary({ q: token, limit: 40 });
    word = rows.map(mapSharedElioCard).find(row => row.vietnamese && matches(row));
  }
  if (!word) {
    try{const response=await fetch('/api/dictionary/lookup?'+new URLSearchParams({word:token}),{signal:AbortSignal.timeout(15000)});
    if(response.ok){const external=await response.json();const vi=external.entries?.find(e=>e.language==='vi'),de=external.entries?.find(e=>e.language==='de');
     if(vi||de)word={german:vi?.title||de.title,vietnamese:vi?.definitions.join('; ')||'',meaning_de:de?.definitions.join('; ')||'',ipa:vi?.ipa?.[0]||de?.ipa?.[0]||'',source:'external_dictionary',external_sources:external.entries.map(e=>({url:e.source,language:e.language})),level:'',topic:'Từ điển ngoài'};
    }}catch{/* AI can still try the word if the external source is unavailable. */}
  }
  if (!word) word={german:token,vietnamese:'',source:'ai_lookup',level:'',topic:'Tra theo ngữ cảnh'};
  if (owner === db.auth.getUser()?.id) {
    if (cache.size >= 150) cache.delete(cache.keys().next().value);
    cache.set(key, word);
  }
  return word;
}

export function WordDetail({ target, onClose }) {
  const dialog = useRef(null);
  const [word, setWord] = useState(target.word || null);
  const [error, setError] = useState('');
  const [enriching,setEnriching]=useState(false);
  const [retry, setRetry] = useState(0);
  const [decks, setDecks] = useState(null);
  const [deckId, setDeckId] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const node = dialog.current;
    const previous = target.anchor || document.activeElement;
    if (mobile || !target.rect) node.showModal();
    else node.show();
    node.querySelector('button')?.focus({ preventScroll: true });
    const outside = event => { if (!node.contains(event.target) || event.target === node) onClose(); };
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('sprach_auth_change', onClose);
    return () => {
      node.close();
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('sprach_auth_change', onClose);
      previous?.focus?.({ preventScroll: true });
    };
  }, [target, mobile, onClose]);
  useEffect(() => {
    if (target.word) return;
    let current = true;
    setError('');
    lookup(target.token).then(value => { if (current) setWord(value); }, failure => { if (current) setError(failure.message); });
    return () => { current = false; };
  }, [target, retry]);
  const enriched=useRef(new Set());
  useEffect(()=>{
   if(!word||!db.auth.getUser()||!db.vocabulary.isCore?.())return;
   const key=normalize(word.german);if(enriched.current.has(key))return;
   const canonical={...word,...vocabularyDetails(word)};
   const fields=['vietnamese','english','ipa','example_de','example_vi','synonyms','antonyms','collocations'].filter(field=>!canonical[field]||Array.isArray(canonical[field])&&!canonical[field].length);
   if(!fields.length)return;enriched.current.add(key);let current=true;const account=db.auth.getUser()?.id;setEnriching(true);
   (async()=>{
    let externalFields={},externalSources=[];
    try{const response=await fetch('/api/dictionary/lookup?'+new URLSearchParams({word:lemma(word.german).replace(/^\(sich\)\s*/,'')}),{signal:AbortSignal.timeout(15000)});if(response.ok){const data=await response.json();const vi=data.entries?.find(e=>e.language==='vi'),de=data.entries?.find(e=>e.language==='de');if(fields.includes('ipa')&&(vi?.ipa?.[0]||de?.ipa?.[0]))externalFields.ipa=vi?.ipa?.[0]||de.ipa[0];if(fields.includes('vietnamese')&&vi?.definitions?.length)externalFields.vietnamese=vi.definitions.join('; ');externalSources=(data.entries||[]).map(e=>({url:e.source,language:e.language}));}}
    catch{/* Keep local data and continue with explicitly labelled AI enrichment. */}
    if(!current||account!==db.auth.getUser()?.id)return;
    if(Object.keys(externalFields).length)setWord(previous=>({...previous,...externalFields,external_sources:[...(previous.external_sources||[]),...externalSources]}));
    const missing=fields.filter(field=>!Object.hasOwn(externalFields,field));if(!missing.length)return;
    const result=await elioClient.enrichWord({word:word.german,context:target.sentence?.slice(0,3000)||'',fields:missing});
    if(current&&account===db.auth.getUser()?.id)setWord(previous=>({...previous,...Object.fromEntries(Object.entries(result.fields).filter(([field])=>missing.includes(field))),ai_fields:[...(previous.ai_fields||[]),...Object.keys(result.fields)],ai_warnings:result.warnings}));
   })().catch(failure=>{if(current)setError('Dữ liệu gốc vẫn được giữ. AI chưa bổ sung được: '+failure.message);}).finally(()=>{if(current)setEnriching(false);});
   return()=>{current=false;};
  },[word?.german]);
  const owner = db.auth.getUser()?.id;
  const canSave = db.vocabulary.isCore?.() ? ['elio_shared','external_dictionary','ai_lookup'].includes(word?.source)&&!!word?.vietnamese : Boolean(word);
  const savedAlready = !db.vocabulary.isCore?.() && word && db.vocabulary.findMany().some(row => lemma(row.german) === lemma(word.german) && normalize(row.article) === normalize(word.article));
  async function chooseDeck() {
    setBusy(true); setError('');
    try {
      const records = await elioClient.records('vocab');
      if (owner !== db.auth.getUser()?.id) return;
      const options = records.filter(row => !row.public && row.owner === owner);
      setDecks(options); setDeckId(options[0]?.id || '');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function save() {
    if (busy || saved || savedAlready) return;
    setBusy(true); setError('');
    try {
      if (db.vocabulary.isCore?.()&&word.source==='elio_shared') {
        const deck = await elioClient.vocabularyDeck(deckId);
        if (owner !== db.auth.getUser()?.id || !deck.canEdit || deck.shared) throw new Error('Bộ từ này không còn khả dụng.');
        const result = await elioClient.saveSharedWord({ sourceId: word.source_id, deckId, revision: deck.revision });
        if (result.conflict) throw new Error('Bộ từ vừa thay đổi. Hãy thử lưu lại.');
      } else {
        await db.vocabulary.create({ ...word, id: undefined, example_de: target.sentence || word.example_de, example_vi: target.translation || word.example_vi });
      }
      if (owner === db.auth.getUser()?.id) setSaved(true);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  const article = word?.article || word?.german?.match(/^(der|die|das)\s/i)?.[1];
  const color = { der: 'text-blue-700 dark:text-blue-300', die: 'text-red-700 dark:text-red-300', das: 'text-green-700 dark:text-green-300' }[normalize(article)];
  const name = article ? word.german.replace(/^(der|die|das)\s+/i, '') : word?.german;
  const sentence = target.sentence || word?.example_de;
  const translation = target.translation || (!target.sentence && word?.example_vi);
  const details = vocabularyDetails(word||{});
  const formFields = [['Số nhiều', word?.plural], ['Ngôi du', word?.du], ['Präteritum', word?.prateritum], ['Partizip II', word?.partizip_ii], ['Trợ động từ', word?.auxiliary], ['Komparativ', word?.comparative], ['Superlativ', word?.superlative], ['Giới từ', word?.preposition], ['Cách', word?.grammatical_case]];
  const rect = target.rect;
  const position = mobile ? { position:'fixed', inset:'auto 0 0', margin:0, width:'100%', maxWidth:'100%' }
    : rect ? { position:'fixed', inset:'auto', margin:0, left:Math.max(8, Math.min(rect.left, window.innerWidth - 440)), top:Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 250)), maxHeight:'calc(100dvh - ' + Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 250)) + 'px - 8px)' } : undefined;
  const [offset, length] = target.range || [-1, 0];
  return createPortal(
    <dialog onClick={event => event.stopPropagation()} ref={dialog} style={position} aria-label="Chi tiết từ vựng" className="z-50 max-h-[85dvh] w-[min(430px,calc(100vw-16px))] overflow-auto rounded-sm border border-border bg-card text-foreground shadow-xl backdrop:bg-black/30">
      <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
        <h2 lang="de" className="font-display text-2xl font-bold break-words">{article && <span className={color}>{article} </span>}{name || target.token}</h2>
        <button type="button" onClick={onClose} aria-label="Đóng chi tiết từ" className="tap px-2 text-xl">×</button>
      </header>
      <div className="space-y-3 p-4">
        {enriching&&<p role="status">Đang tra AI bổ sung các trường còn thiếu…</p>}
        {!word && !error && <p role="status">Đang tra từ…</p>}
        {word && <>
          {target.token && lemma(target.token) !== lemma(word.german) && <p lang="de">{target.token} → {word.german}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <SpeakButton text={word.german} />
            <SpeakButton text={word.german} slow />
            {(word.ipa || word.phonetic) && <span>IPA {word.ipa || word.phonetic}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{[word.word_type, word.level, word.topic].filter(Boolean).join(' · ')}</p>
          <p className="text-lg font-semibold">{word.vietnamese || 'Chưa có nghĩa tiếng Việt'}</p>
          {sentence && <div className="rounded-sm border border-border p-3">
            <p lang="de">{offset >= 0 ? <>{sentence.slice(0, offset)}<mark>{sentence.slice(offset, offset + length)}</mark>{sentence.slice(offset + length)}</> : sentence}</p>
            {translation && <p className="text-sm text-muted-foreground">{translation}</p>}
            <SpeakButton text={sentence} size="sm" />
          </div>}
          {word.external_sources&&<p className="text-sm">Nguồn ngoài: {word.external_sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="text-accent underline mr-2">Wiktionary {source.language} · CC BY-SA</a>)}</p>}
          {word.ai_fields?.length>0&&<p className="text-sm text-muted-foreground">AI bổ sung (cần đối chiếu): {word.ai_fields.join(', ')}. Dữ liệu nguồn không bị ghi đè.</p>}
          <details open>
            <summary className="cursor-pointer font-medium">Xem chi tiết</summary>
            {word.english && <p>Tiếng Anh · {word.english}</p>}
            {details.meaning_de && <p lang="de">{details.meaning_de}</p>}
            {formFields.filter(([, value]) => typeof value === 'string' && value).map(([label, value]) => <p key={label}>{label} · {value}</p>)}
            {word.separable === true && <p>Động từ tách</p>}
            {word.reflexive === true && <p>Động từ phản thân</p>}
            {details.notes && <p>{details.notes}</p>}
            {[['Đồng nghĩa', details.synonyms], ['Trái nghĩa', details.antonyms], ['Chunk / Cụm từ đi kèm', details.phrases]].map(([label, items]) => lexicalItems(items).length > 0 && <section key={label}><h3 className="font-semibold">{label}</h3><ul>{lexicalItems(items).map((item, index) => <li key={index}>{typeof item === 'string' ? item : [item?.de, item?.vi].filter(Boolean).join(' — ')}</li>)}</ul></section>)}
          </details>
          {word.due_date && <p className="text-sm">Ôn tiếp ngày {word.due_date}{word.status ? ' · ' + word.status : ''}</p>}
          <div className="flex flex-wrap items-center gap-3">
            {(saved || savedAlready) ? <span role="status">Đã lưu</span> : canSave && <button type="button" disabled={busy || Boolean(word.source==='elio_shared'&&decks && !deckId)} onClick={db.vocabulary.isCore?.() && word.source==='elio_shared' && !decks ? chooseDeck : save} className="tap rounded-sm bg-accent px-3 py-2 text-accent-foreground">＋ Lưu vào Từ của tôi</button>}
            {db.vocabulary.isCore?.() && word.id && <a href="#/review" className="text-accent underline">Mở ôn tập</a>}
          </div>
          {decks && !saved && (decks.length ? <label className="block text-sm">Bộ đích <select className="border border-border bg-card" value={deckId} onChange={e => setDeckId(e.target.value)}>{decks.map(deck => <option key={deck.id} value={deck.id}>{deck.title || deck.id}</option>)}</select></label> : <p>Chưa có bộ từ cá nhân để lưu.</p>)}
        </>}
        {error && <p role="alert">{error} {!word && <button className="text-accent underline" onClick={() => setRetry(value => value + 1)}>Thử lại</button>}</p>}
      </div>
    </dialog>, document.body
  );
}

const excluded = 'a,button,input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="button"]';

export const LookupText = React.memo(function LookupText({ text, translation, stopPropagation = false }) {
  const [target, setTarget] = useState(null);
  const [selection, setSelection] = useState(null);
  const close = React.useCallback(() => setTarget(null), []);
  useEffect(() => { setTarget(null); setSelection(null); }, [text]);
  if (typeof text !== 'string' || !text) return text;
  const parts = text.split(/([\p{L}]+(?:['’\u2010-][\p{L}]+)*)/gu);
  let offset = 0;
  const onSelect = event => {
    const selected = window.getSelection();
    if (event.target.closest(excluded) || !selected || selected.isCollapsed || !event.currentTarget.contains(selected.anchorNode) || !event.currentTarget.contains(selected.focusNode)) {
      setSelection(null); return;
    }
    const token = selected.toString().trim();
    if (!token || token.length > 120) { setSelection(null); return; }
    const range = selected.getRangeAt(0);
    const prefix = document.createRange();
    prefix.selectNodeContents(event.currentTarget);
    prefix.setEnd(range.startContainer, range.startOffset);
    const start = prefix.toString().length + selected.toString().indexOf(token);
    setSelection({ token, range: [start, token.length], rect: range.getBoundingClientRect() });
  };
  return <>
    <span data-lookup-root="true" lang="de" tabIndex={0} aria-label="Văn bản tiếng Đức, chọn từ để tra nghĩa" onKeyUp={event => { if (event.key === 'Enter') onSelect(event); }} onPointerUp={onSelect} onClick={event => {
      if (event.target.closest(excluded)) return;
      if (stopPropagation) event.stopPropagation();
      if (!window.getSelection()?.isCollapsed) return;
      const token = event.target.dataset.lookup;
      if (!token) return;
      setSelection(null);
      setTarget({ token, sentence:text, translation, anchor:event.target, range:[Number(event.target.dataset.offset),token.length], rect:event.target.getBoundingClientRect() });
    }}>{parts.map((part, index) => {
      const start = offset; offset += part.length;
      return index % 2 ? <span key={index} data-lookup={part} data-offset={start} className="cursor-pointer hover:underline" tabIndex={-1}>{part}</span> : part;
    })}</span>
    {selection && <button type="button" className="tap mx-1 text-accent underline" onPointerDown={event => event.preventDefault()} onClick={event => {
      event.stopPropagation();
      setTarget({ ...selection, sentence:text, translation });
      setSelection(null);
    }}>Tra nghĩa</button>}
    {target && <WordDetail key={JSON.stringify(target.range)} target={target} onClose={close} />}
  </>;
});

export function WordDetailsTrigger({word,children}){
 const [target,setTarget]=useState(null);
 const close=React.useCallback(()=>setTarget(null),[]);
 return <><button type="button" className="text-left hover:underline font-inherit" aria-label={'Xem đầy đủ dữ liệu từ '+(word.german||word.de||'')} onClick={event=>{event.stopPropagation();setTarget({word,token:word.german,anchor:event.currentTarget});}}>{children}</button>{target&&<WordDetail target={target} onClose={close}/>}</>;
}
