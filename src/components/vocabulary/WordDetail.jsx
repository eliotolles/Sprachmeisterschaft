import {vocabularyDetails,lexicalItems} from '@/lib/vocabulary-details';
import {wordTypeAbbr} from '@/lib/word-type';
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
  // Không còn nguồn ngoài (Wiktionary): từ không có trong app thì AI viết nghĩa ngay,
  // không chờ fetch từ điển ngoài (tới 15 giây) rồi mới tới AI.
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
  const [enrichAttempt, setEnrichAttempt] = useState(0);
  const [decks, setDecks] = useState(null);
  const [deckId, setDeckId] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    const previous = target.anchor || document.activeElement;
    // Luôn mở dạng modal căn giữa trang, không định vị theo chỗ bấm nữa.
    node.showModal();
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
  }, [target, onClose]);
  useEffect(() => {
    if (target.word) return;
    let current = true;
    setError('');
    lookup(target.token).then(value => { if (current) setWord(value); }, failure => { if (current) setError(failure.message); });
    return () => { current = false; };
  }, [target, retry]);
  const enriched=useRef(new Set());
  // AI enrichment: gọi AI ngay khi mở popup, không chờ nguồn ngoài nữa.
  // Trước đây effect này fetch Wiktionary trước (tới 3 giây) rồi mới gọi AI,
  // nên nghĩa tiếng Việt cứ "đang tra" mãi. Lỗi AI bị nuốt lặng sẽ mở đường
  // cho nút "Tra lại nghĩa bằng AI" (xem retryEnrich).
  useEffect(()=>{
   if(!word||!db.auth.getUser()||!db.vocabulary.isCore?.())return;
   const key=normalize(word.german);if(enriched.current.has(key))return;
   const canonical={...word,...vocabularyDetails(word)};
   // Nếu từ đã có nghĩa tiếng Việt thì hiển thị ngay lập tức, không tự động bắt AI tra ngầm gây chờ đợi lâu
   if (canonical.vietnamese && canonical.vietnamese.trim()) return;
   // Chỉ xin đúng các trường popup đang cần (nghĩa, IPA, ví dụ, đồng/trái nghĩa,
   // cụm từ) — không xin thừa tiếng Anh — để AI viết xong nhanh hơn.
   const fields=['vietnamese','ipa','example_de','example_vi','synonyms','antonyms','collocations'].filter(field=>!canonical[field]||Array.isArray(canonical[field])&&!canonical[field].length);
   if(!fields.length)return;enriched.current.add(key);let current=true;const account=db.auth.getUser()?.id;setEnriching(true);
   (async()=>{
    if(!current||account!==db.auth.getUser()?.id)return;
    const result=await elioClient.enrichWord({word:word.german,context:target.sentence?.slice(0,3000)||'',fields});
    if(current&&account===db.auth.getUser()?.id)setWord(previous=>({...previous,...Object.fromEntries(Object.entries(result.fields).filter(([field])=>fields.includes(field))),ai_fields:[...(previous.ai_fields||[]),...Object.keys(result.fields)],ai_warnings:result.warnings}));
   })().catch(()=>{ enriched.current.delete(key); /* Bỏ qua lỗi AI để người dùng không bị làm phiền — nút "Tra lại nghĩa bằng AI" sẽ cho tra lại. */}).finally(()=>{if(current)setEnriching(false);});
   return()=>{current=false;};
  },[word?.german, word?.source, enrichAttempt]);
  // Bấm "Tra lại nghĩa bằng AI": cho phép tra lại sau khi AI lỗi (trước đây từ kẹt ở "Chưa có nghĩa tiếng Việt" vì lỗi bị nuốt lặng và không có đường thử lại).
  function retryEnrich() {
    if (!word) return;
    enriched.current.delete(normalize(word.german));
    setEnrichAttempt(value => value + 1);
  }
  const owner = db.auth.getUser()?.id;
  const canSave = db.vocabulary.isCore?.() ? ['elio_shared','ai_lookup'].includes(word?.source)&&!!word?.vietnamese : Boolean(word);
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
  const meaningDe = details.meaning_de || word?.meaning_de || '';
  const typeAbbr = wordTypeAbbr(word, article);
  const formFields = [['Số nhiều', word?.plural], ['Ngôi du', word?.du], ['Präteritum', word?.prateritum], ['Partizip II', word?.partizip_ii], ['Trợ động từ', word?.auxiliary], ['Komparativ', word?.comparative], ['Superlativ', word?.superlative], ['Giới từ', word?.preposition], ['Cách', word?.grammatical_case]];
  // Cụm từ hay gặp: gộp phrases + collocations, khử trùng, chỉ hiện khi có dữ liệu.
  const phraseItems = [...new Set([...lexicalItems(details.phrases), ...lexicalItems(details.collocations)].map(item => typeof item === 'string' ? item : [item?.de, item?.vi].filter(Boolean).join(' — ')).filter(Boolean))];
  const grammarEntries = [
    ...formFields.filter(([, value]) => typeof value === 'string' && value),
    ...(word?.separable === true ? [['Động từ tách', 'Có']] : []),
    ...(word?.reflexive === true ? [['Động từ phản thân', 'Có']] : []),
    ...(phraseItems.length ? [['Cụm từ', phraseItems.join('; ')]] : []),
    ...(details.notes ? [['Ghi chú', details.notes]] : []),
  ];
  const [offset, length] = target.range || [-1, 0];
  return createPortal(
    <dialog onClick={event => event.stopPropagation()} ref={dialog} aria-label="Chi tiết từ vựng" className="z-50 m-auto max-h-[85dvh] w-[min(560px,92vw)] overflow-auto rounded-md border border-border bg-card text-foreground shadow-xl backdrop:bg-black/50">
      <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-border bg-card p-4">
        <h2 lang="de" className="font-display text-2xl font-bold break-words">{article && <span className={color}>{article} </span>}{name || target.token}{typeAbbr && <span className="ml-2 align-middle text-base font-semibold text-muted-foreground">{typeAbbr}</span>}</h2>
        <button type="button" onClick={onClose} aria-label="Đóng chi tiết từ" className="tap px-2 text-xl">×</button>
      </header>
      <div className="space-y-3 p-4">
        {enriching && (!word?.vietnamese || !word.vietnamese.trim()) && (
          <p role="status" className="text-xs text-muted-foreground animate-pulse">
            AI đang viết nghĩa…
          </p>
        )}
        {!word && !error && <p role="status">Đang tra từ…</p>}
        {word && <>
          {target.token && lemma(target.token) !== lemma(word.german) && <p lang="de">{target.token} → {word.german}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <SpeakButton text={word.german} />
            <SpeakButton text={word.german} slow />
            {(word.ipa || word.phonetic) && <span>IPA {word.ipa || word.phonetic}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{[word.level, word.topic].filter(Boolean).join(' · ')}</p>
          <section aria-label="Nghĩa tiếng Việt">
            {word.vietnamese ? <p className="text-xl font-bold leading-snug">{word.vietnamese}</p> : <>
              {meaningDe ? <div className="rounded-sm border border-border bg-muted/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Nghĩa tiếng Đức (tạm thời — đang tra nghĩa tiếng Việt)</p>
                <p lang="de" className="mt-1">{meaningDe}</p>
              </div> : <p className="text-lg font-semibold text-muted-foreground">Chưa có nghĩa tiếng Việt</p>}
              {!enriching && db.auth.getUser() && db.vocabulary.isCore?.() && <button type="button" onClick={retryEnrich} className="tap mt-2 text-sm text-accent underline">Tra lại nghĩa bằng AI</button>}
            </>}
            {word.english && <p className="mt-1 text-sm text-muted-foreground">Tiếng Anh · {word.english}</p>}
          </section>
          {sentence && <section aria-label="Câu ví dụ">
            <h3 className="mb-1 text-sm font-semibold text-muted-foreground">Ví dụ</h3>
            <div className="rounded-sm border border-border p-3">
              <p lang="de">{offset >= 0 ? <>{sentence.slice(0, offset)}<mark>{sentence.slice(offset, offset + length)}</mark>{sentence.slice(offset + length)}</> : sentence}</p>
              {translation && <p className="mt-1 text-sm text-muted-foreground">{translation}</p>}
              <SpeakButton text={sentence} size="sm" />
            </div>
          </section>}
          {word.ai_fields?.length>0&&<p className="text-sm text-muted-foreground">AI viết nghĩa (cần đối chiếu): {word.ai_fields.join(', ')}. Dữ liệu nguồn không bị ghi đè.</p>}
          {(lexicalItems(details.synonyms).length > 0 || lexicalItems(details.antonyms).length > 0) && <section aria-label="Đồng nghĩa và trái nghĩa" className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Đồng nghĩa / Trái nghĩa</h3>
            {lexicalItems(details.synonyms).length > 0 && <div>
              <p className="text-sm font-medium">Đồng nghĩa</p>
              <ul className="list-disc pl-5 text-sm">{lexicalItems(details.synonyms).map((item, index) => <li key={index}>{typeof item === 'string' ? item : [item?.de, item?.vi].filter(Boolean).join(' — ')}</li>)}</ul>
            </div>}
            {lexicalItems(details.antonyms).length > 0 && <div>
              <p className="text-sm font-medium">Trái nghĩa</p>
              <ul className="list-disc pl-5 text-sm">{lexicalItems(details.antonyms).map((item, index) => <li key={index}>{typeof item === 'string' ? item : [item?.de, item?.vi].filter(Boolean).join(' — ')}</li>)}</ul>
            </div>}
          </section>}
          {grammarEntries.length > 0 && <section aria-label="Ngữ pháp và cụm từ">
            <h3 className="text-sm font-semibold text-muted-foreground">Ngữ pháp &amp; cụm từ</h3>
            <dl className="mt-1 space-y-1 text-sm">
              {grammarEntries.map(([label, value]) => <div key={label} className="flex gap-2"><dt className="shrink-0 font-medium text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </section>}
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
