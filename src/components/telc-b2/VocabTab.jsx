// Tab "Từ vựng" — 600 cụm từ + 56 từ trong bài chẩn đoán, Leitner + quiz.
// Port từ app gốc "Học telc B2" (Vocab.tsx).
// YÊU CẦU TỪ ELIO 2026-11-17: mọi thẻ từ phải LUÔN hiển thị dòng đồng nghĩa.
// Dữ liệu gốc chỉ có syn ở một số ít mục — phần còn thiếu được bổ sung trong
// src/data/telc-b2/synonyms.js (getVocabSynonym) và hiển thị ở mọi nơi: RichCard,
// StudyCard, flashcard/liste chủ đề gốc và PlusList.
import React, { useMemo, useState } from 'react';
import { VOCAB_TOPICS } from '@/data/telc-b2/data-plan';
import { PLAN_START } from '@/data/telc-b2/data-content';
import { B1_GROUPS, B2_TELC_TOPICS, DIAG_GROUP } from '@/data/telc-b2/data-vocab-rich';
import {
  NOMINALISIERUNG, NVV, REDEMITTEL_DISKUSSION, REDEMITTEL_EMAIL,
  SYNONYM_GROUPS, TELC_TYPICAL, TOPIC_PLUS,
} from '@/data/telc-b2/data-vocab-plus';
import { getVocabSynonym } from '@/data/telc-b2/synonyms';
import { ALL_ENTRIES, DAILY_NEW, entryKey } from '@/data/telc-b2/entries';

function planDayToday() {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayStr = fmt.format(new Date());
  const start = new Date(`${PLAN_START}T00:00:00Z`).getTime();
  const today = new Date(`${todayStr}T00:00:00Z`).getTime();
  const d = Math.round((today - start) / 86400000) + 1;
  return Math.min(Math.max(d, 1), 60);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function SynLine({ item }) {
  const syn = getVocabSynonym(item);
  if (!syn) return null;
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      <span className="font-semibold text-foreground">≈ Đồng nghĩa:</span> {syn}
    </p>
  );
}

function RichCard({ item, mastered, onToggle }) {
  return (
    <li className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className={`font-bold italic ${mastered ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
            {item.de}{' '}
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold not-italic text-muted-foreground">{item.pos}</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{item.vi}</p>
          <p className="mt-1.5 text-sm leading-relaxed">
            <span className="font-semibold text-accent">Ví dụ: </span>
            <span className="italic">{item.ex}</span>
          </p>
          <SynLine item={item} />
          {item.ant && (
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">≠ Trái nghĩa:</span> {item.ant}
            </p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Cụm đi kèm:</span> {item.col}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={mastered}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${mastered ? 'bg-emerald-500 text-white' : 'bg-muted'}`}
        >
          {mastered ? 'Đã thuộc ✓' : 'Thuộc'}
        </button>
      </div>
    </li>
  );
}

function RichSection({ groups, masteredSet, onToggle }) {
  const [groupId, setGroupId] = useState(null);
  const group = groups.find((g) => g.id === groupId) ?? groups[0];
  if (!group) return null;
  const groupMastered = group.items.filter((_, i) => masteredSet.has(`${group.id}:${i}`)).length;
  return (
    <div>
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn nhóm từ">
          {groups.map((g) => {
            const n = g.items.filter((_, i) => masteredSet.has(`${g.id}:${i}`)).length;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroupId(g.id)}
                aria-pressed={group.id === g.id}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${group.id === g.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {g.nameVi} · {n}/{g.items.length}
              </button>
            );
          })}
        </div>
      )}
      <h3 className="mt-5 text-lg font-extrabold text-foreground">{group.name} <span className="text-base font-semibold text-muted-foreground">— {group.nameVi}</span></h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Đã thuộc {groupMastered}/{group.items.length} cụm của nhóm này. Mỗi cụm có loại từ, câu ví dụ đầy đủ và cụm đi kèm — học cả câu, không học từ lẻ.
      </p>
      <ul className="mt-3 space-y-2.5">
        {group.items.map((item, i) => (
          <RichCard key={item.de} item={item} mastered={masteredSet.has(`${group.id}:${i}`)} onToggle={() => onToggle(group.id, i, !masteredSet.has(`${group.id}:${i}`))} />
        ))}
      </ul>
    </div>
  );
}

function PlusList({ items }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.de} className="rounded-xl border border-border bg-card p-3.5">
          <p className="font-bold italic text-foreground">{item.de}</p>
          <p className="text-sm text-muted-foreground">{item.vi}</p>
          <SynLine item={item} />
          <p className="mt-1.5 text-sm leading-relaxed">
            <span className="font-semibold text-accent">Ví dụ: </span>
            <span className="italic">{item.example}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function StudyCard({ entry, mastered, revealed, onReveal, onReview }) {
  const syn = getVocabSynonym(entry.rich || entry);
  return (
    <li className="rounded-xl border border-border bg-card p-3.5">
      <p className="font-bold italic text-foreground">
        {entry.de}
        {entry.rich && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold not-italic text-muted-foreground">{entry.rich.pos}</span>}
        {mastered && <span className="ml-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">Đã thuộc ✓</span>}
      </p>
      {!revealed ? (
        <button type="button" onClick={onReveal} className="mt-2 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold">
          Hiện nghĩa &amp; ví dụ
        </button>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">{entry.vi}</p>
          {syn && (
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">≈ Đồng nghĩa:</span> {syn}
            </p>
          )}
          {entry.rich && (
            <>
              <p className="mt-1.5 text-sm leading-relaxed">
                <span className="font-semibold text-accent">Ví dụ: </span>
                <span className="italic">{entry.rich.ex}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Cụm đi kèm:</span> {entry.rich.col}
                {entry.rich.ant && (<> · <span className="font-semibold text-foreground">≠</span> {entry.rich.ant}</>)}
              </p>
            </>
          )}
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => onReview(true)} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white">Đã thuộc ✓</button>
            <button type="button" onClick={() => onReview(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Chưa thuộc — ôn lại</button>
          </div>
        </>
      )}
    </li>
  );
}

function StudyMode({ progress, masteredSet, onReviewVocab }) {
  const [revealed, setRevealed] = useState(new Set());
  const [quiz, setQuiz] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizNote, setQuizNote] = useState(null);

  const day = planDayToday();
  const reviewMap = useMemo(() => new Map((progress.reviews || []).map((r) => [`${r.topicId}:${r.itemIndex}`, r])), [progress]);
  const now = Date.now();
  const dueEntries = ALL_ENTRIES.filter((e) => {
    const r = reviewMap.get(entryKey(e));
    return r !== undefined && new Date(r.dueAt).getTime() <= now;
  });
  const newEntries = ALL_ENTRIES.filter(
    (e, idx) => Math.floor(idx / DAILY_NEW) + 1 <= day && !masteredSet.has(entryKey(e)) && !reviewMap.has(entryKey(e)),
  ).slice(0, 30);

  const reveal = (k) => setRevealed((prev) => new Set(prev).add(k));

  const startQuiz = () => {
    const introduced = ALL_ENTRIES.filter((e) => masteredSet.has(entryKey(e)) || reviewMap.has(entryKey(e)));
    const pool = introduced.length >= 10 ? introduced : [...dueEntries, ...newEntries];
    if (pool.length < 4) {
      setQuizNote('Chưa đủ từ để làm bài kiểm tra — anh học vài từ mới ở trên trước, rồi quay lại làm quiz nhé.');
      return;
    }
    setQuizNote(null);
    const chosen = shuffle(pool).slice(0, 10);
    const qs = chosen.map((entry) => {
      const distractors = shuffle(ALL_ENTRIES.filter((e) => e.de !== entry.de && e.vi !== entry.vi)).slice(0, 3).map((e) => e.vi);
      const options = shuffle([entry.vi, ...distractors]);
      return { entry, options, correctIdx: options.indexOf(entry.vi) };
    });
    setQuiz(qs); setQIdx(0); setPicked(null); setQuizScore(0);
  };

  const answerQuiz = (i) => {
    if (!quiz || picked !== null) return;
    const q = quiz[qIdx];
    if (!q) return;
    setPicked(i);
    if (i === q.correctIdx) setQuizScore((s) => s + 1);
    else onReviewVocab(q.entry.topicId, q.entry.itemIndex, false); // Sai thì ôn lại ngày mai.
  };

  const currentQ = quiz?.[qIdx];
  const quizDone = quiz !== null && qIdx >= quiz.length;

  return (
    <div>
      <div className="rounded-xl bg-muted p-4">
        <p className="font-extrabold text-foreground">Ngày {day}/60 — hôm nay: {newEntries.length} từ mới · {dueEntries.length} từ đến hạn ôn</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Lộ trình nạp {DAILY_NEW} từ mới mỗi ngày theo thứ tự: nền B1 trước, rồi 10 chủ đề gốc, rồi phần B2 nâng cao — đủ 600 cụm trong khoảng 22 ngày đầu.
          Từ đã học quay lại theo vòng lặp ngắt quãng (1 → 2 → 4 → 7 → 14 → 30 ngày): bấm “Đã thuộc” thì giãn cách dài ra, “Chưa thuộc” thì mai ôn lại từ đầu.
          Cách học: nhìn cụm tiếng Đức, tự nói nghĩa và đặt 1 câu, rồi mới bấm “Hiện nghĩa” để đối chiếu.
        </p>
      </div>

      <h3 className="mt-7 text-lg font-extrabold text-foreground">Từ mới hôm nay ({newEntries.length})</h3>
      {newEntries.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Không còn từ mới theo lịch hôm nay — hoặc anh đã học hết phần của hôm nay, hoặc đã về đích cả 600 cụm. Cứ ôn phần đến hạn bên dưới và làm bài kiểm tra nhanh.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {newEntries.map((e) => (
            <StudyCard key={entryKey(e)} entry={e} mastered={masteredSet.has(entryKey(e))} revealed={revealed.has(entryKey(e))} onReveal={() => reveal(entryKey(e))} onReview={(known) => onReviewVocab(e.topicId, e.itemIndex, known)} />
          ))}
        </ul>
      )}

      <h3 className="mt-7 text-lg font-extrabold text-foreground">Ôn lại đến hạn ({dueEntries.length})</h3>
      {dueEntries.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Không có từ nào đến hạn ôn hôm nay.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {dueEntries.map((e) => (
            <StudyCard key={entryKey(e)} entry={e} mastered={masteredSet.has(entryKey(e))} revealed={revealed.has(entryKey(e))} onReveal={() => reveal(entryKey(e))} onReview={(known) => onReviewVocab(e.topicId, e.itemIndex, known)} />
          ))}
        </ul>
      )}

      <h3 className="mt-7 text-lg font-extrabold text-foreground">Kiểm tra nhanh — 10 câu</h3>
      {quizNote && <p className="mt-2 text-sm text-amber-600">{quizNote}</p>}
      {!quiz && (
        <button type="button" onClick={startQuiz} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Làm bài kiểm tra 10 câu
        </button>
      )}
      {quiz && !quizDone && currentQ && (
        <div className="mt-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Câu {qIdx + 1}/{quiz.length} · Đúng {quizScore} câu</p>
          <p className="mt-2 font-bold italic text-foreground text-lg">{currentQ.entry.de}</p>
          <div className="mt-3 space-y-2">
            {currentQ.options.map((opt, i) => {
              const isCorrect = i === currentQ.correctIdx;
              const isPicked = picked === i;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => answerQuiz(i)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${picked !== null && isCorrect ? 'border-emerald-500 bg-emerald-500/10' : picked !== null && isPicked ? 'border-red-400 bg-red-500/10' : 'border-border hover:border-accent/50'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <button type="button" onClick={() => { setQIdx((i) => i + 1); setPicked(null); }} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              {qIdx + 1 >= quiz.length ? 'Xem kết quả' : 'Câu tiếp theo →'}
            </button>
          )}
        </div>
      )}
      {quizDone && quiz && (
        <div className="mt-3 rounded-xl border border-border bg-card p-4">
          <p className="font-extrabold text-foreground">Đúng {quizScore}/{quiz.length} câu</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {quizScore >= 8 ? 'Xuất sắc — vốn từ hôm nay đã chắc. Mai học tiếp 28 từ mới.' : quizScore >= 5 ? 'Khá — những từ làm sai đã được đưa vào vòng ôn ngày mai.' : 'Còn yếu — ôn lại các từ đã học hôm nay rồi làm lại quiz ngày mai.'}
          </p>
          <button type="button" onClick={() => setQuiz(null)} className="mt-3 rounded-lg bg-muted px-4 py-2 text-sm font-semibold">Đóng</button>
        </div>
      )}
    </div>
  );
}

export function VocabTab({ progress, onToggleVocab, onReviewVocab }) {
  const [view, setView] = useState('study');
  const [topicId, setTopicId] = useState(1);
  const [mode, setMode] = useState('flash');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const masteredSet = useMemo(() => new Set((progress.mastered || []).map((m) => `${m.topicId}:${m.itemIndex}`)), [progress]);
  const topic = VOCAB_TOPICS.find((t) => t.id === topicId) ?? VOCAB_TOPICS[0];
  const topicMastered = topic.items.filter((_, i) => masteredSet.has(`${topic.id}:${i}`)).length;
  const card = topic.items[cardIdx] ?? topic.items[0];
  const cardMastered = masteredSet.has(`${topic.id}:${cardIdx}`);
  const cardSyn = getVocabSynonym(card);

  const pickTopic = (id) => { setTopicId(id); setCardIdx(0); setFlipped(false); };
  const nextCard = (dir) => { setCardIdx((cardIdx + dir + topic.items.length) % topic.items.length); setFlipped(false); };

  const mastered600 = (progress.mastered || []).filter((m) => m.topicId <= 212).length;
  const diagMastered = (progress.mastered || []).filter((m) => m.topicId === 301).length;

  const views = [
    ['study', 'Học & ôn hôm nay'],
    ['b1', 'Nền tảng B1 (200 cụm)'],
    ['topics', 'Chủ đề gốc (240 cụm)'],
    ['b2telc', 'B2 nâng cao — 12 chủ đề telc (160 cụm)'],
    ['diag', 'Từ mới trong bài chẩn đoán Ngày 1'],
    ['plus', 'Nâng cấp B2: đồng nghĩa · NVV · Redemittel'],
  ];

  return (
    <div className="space-y-6">
      <div className="surface p-5">
        <div className="eyebrow mb-1">Từ vựng · 600 cụm + 56 từ chẩn đoán</div>
        <h2 className="font-display text-2xl font-bold text-foreground">600 cụm từ — đủ vốn cho telc B2</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          <b className="text-foreground">200 cụm nền tảng B1</b> (đời sống, công việc, học tập, sức khỏe, giao tiếp) + <b className="text-foreground">240 cụm chủ đề gốc</b> + <b className="text-foreground">160 cụm B2 nâng cao theo 12 chủ đề telc hay ra</b>.
          Mỗi cụm đều có <b className="text-foreground">dòng đồng nghĩa (≈)</b>, câu ví dụ đầy đủ và cụm đi kèm — học cả câu, không học từ lẻ.
          Đã thuộc <b className="text-foreground">{mastered600}/600</b> cụm{diagMastered > 0 && ` và ${diagMastered}/${DIAG_GROUP.items.length} từ trong đề chẩn đoán`}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn mục từ vựng">
        {views.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === id ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>
            {label}
          </button>
        ))}
      </div>

      {view === 'study' && <StudyMode progress={progress} masteredSet={masteredSet} onReviewVocab={onReviewVocab} />}

      {view === 'b1' && (
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">200 cụm gốc của B1 theo 5 mảng dùng hằng ngày — đây là phần vá đúng chỗ “80% từ trong bài đọc chưa biết”: đọc, viết, nói câu nào cũng dựa trên những cụm này. Học theo thứ tự nhóm, mỗi cụm thuộc cả câu ví dụ.</p>
          <div className="mt-4"><RichSection groups={B1_GROUPS} masteredSet={masteredSet} onToggle={onToggleVocab} /></div>
        </div>
      )}

      {view === 'b2telc' && (
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">160 cụm trang trọng, học thuật chia theo 12 chủ đề telc B2 hay ra nhất — phần làm bài Viết và Nói “đặc biệt” hơn hẳn mức B1. Học thuộc cả câu ví dụ để dùng nguyên trong phòng thi.</p>
          <div className="mt-4"><RichSection groups={B2_TELC_TOPICS} masteredSet={masteredSet} onToggle={onToggleVocab} /></div>
        </div>
      )}

      {view === 'diag' && (
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">56 từ lấy từ 3 bài Đọc của đề chẩn đoán Ngày 1 — chính những từ Elio thấy khó khi làm đề. Học nhóm này trước khi làm lại đề chẩn đoán.</p>
          <div className="mt-4"><RichSection groups={[DIAG_GROUP]} masteredSet={masteredSet} onToggle={onToggleVocab} /></div>
        </div>
      )}

      {view === 'topics' && (
        <div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn chủ đề">
            {VOCAB_TOPICS.map((t) => (
              <button key={t.id} type="button" onClick={() => pickTopic(t.id)} aria-pressed={topic.id === t.id} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${topic.id === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {t.nameVi} · {topic.id === t.id ? `${topicMastered}/${t.items.length}` : t.items.length}
              </button>
            ))}
          </div>
          <h3 className="mt-5 text-lg font-extrabold text-foreground">{topic.name} <span className="text-base font-semibold text-muted-foreground">— {topic.nameVi}</span></h3>
          <p className="mt-1 text-sm text-muted-foreground">Đã thuộc {topicMastered}/{topic.items.length} cụm của chủ đề này.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setMode('flash')} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'flash' ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>Thẻ ghi nhớ</button>
            <button type="button" onClick={() => setMode('list')} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${mode === 'list' ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>Danh sách</button>
          </div>
          {mode === 'flash' ? (
            <div className="mt-4 rounded-xl border border-border bg-card p-5 text-center">
              <p className="text-xs text-muted-foreground">Thẻ {cardIdx + 1}/{topic.items.length} · {cardMastered ? 'Đã thuộc ✓' : 'Chưa thuộc'}</p>
              {!flipped ? (
                <button type="button" onClick={() => setFlipped(true)} className="mt-3">
                  <span className="block font-display text-2xl font-bold text-foreground">{card.de}</span>
                  <span className="mt-2 inline-block rounded-lg border border-border px-3 py-1.5 text-sm font-semibold">Lật thẻ — hiện nghĩa</span>
                </button>
              ) : (
                <div className="mt-3">
                  <p className="text-lg text-foreground">{card.vi}</p>
                  {cardSyn && (
                    <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">≈ Đồng nghĩa:</span> {cardSyn}</p>
                  )}
                  <button type="button" onClick={() => onToggleVocab(topic.id, cardIdx, !cardMastered)} className={`mt-3 rounded-lg px-4 py-2 text-sm font-semibold ${cardMastered ? 'bg-emerald-500 text-white' : 'bg-muted'}`}>
                    {cardMastered ? 'Đã thuộc ✓' : 'Đánh dấu đã thuộc'}
                  </button>
                </div>
              )}
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" onClick={() => nextCard(-1)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">← Trước</button>
                <button type="button" onClick={() => nextCard(1)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">Sau →</button>
              </div>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {topic.items.map((item, i) => (
                <li key={item.de} className="rounded-xl border border-border bg-card p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold italic text-foreground">{item.de}</p>
                      <p className="text-sm text-muted-foreground">{item.vi}</p>
                      <SynLine item={item} />
                    </div>
                    <button type="button" onClick={() => onToggleVocab(topic.id, i, !masteredSet.has(`${topic.id}:${i}`))} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${masteredSet.has(`${topic.id}:${i}`) ? 'bg-emerald-500 text-white' : 'bg-muted'}`}>
                      {masteredSet.has(`${topic.id}:${i}`) ? 'Đã thuộc ✓' : 'Thuộc'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-7 text-lg font-extrabold text-foreground">Nâng cao theo chủ đề — {topic.nameVi}</h3>
          <p className="text-sm text-muted-foreground">6 cụm trang trọng hơn cho cùng chủ đề, dùng khi viết và nói ở mức B2.</p>
          <div className="mt-3"><PlusList items={TOPIC_PLUS[topic.id] ?? []} /></div>
        </div>
      )}

      {view === 'plus' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Nâng cấp từ cơ bản → từ B2</h3>
            <p className="text-sm text-muted-foreground">Thay từ B1 quen thuộc bằng từ trang trọng hơn — cách nhanh nhất để bài Viết và Nói nghe “B2”.</p>
            <div className="mt-3 space-y-3">
              {SYNONYM_GROUPS.map((g) => (
                <div key={g.basic} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold text-foreground">{g.basic} <span className="text-muted-foreground font-normal">({g.basicVi}) → nâng cấp:</span></p>
                  <div className="mt-2 space-y-2">
                    {g.upgrades.map((u) => (
                      <div key={u.de}>
                        <p className="font-bold italic text-foreground">{u.de} <span className="not-italic font-normal text-muted-foreground text-sm">— {u.vi}</span></p>
                        <p className="text-sm text-muted-foreground italic">{u.example}</p>
                        <SynLine item={u} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Nominalisierung — danh từ hóa</h3>
            <p className="text-sm text-muted-foreground">Viết B2 chuộng danh từ hơn động từ: “bei der Anmeldung” nghe học thuật hơn “wenn man sich anmeldet”.</p>
            <ul className="mt-3 space-y-2.5">
              {NOMINALISIERUNG.map((n) => (
                <li key={n.phrase} className="rounded-xl border border-border bg-card p-3.5">
                  <p className="text-sm text-muted-foreground line-through">{n.phrase}</p>
                  <p className="font-bold italic text-foreground">→ {n.nominal}</p>
                  <p className="text-sm text-muted-foreground italic mt-1">{n.example}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Nomen-Verb-Verbindungen (NVV)</h3>
            <p className="text-sm text-muted-foreground">Cụm danh từ + động từ cố định — dùng sai là mất điểm ngay.</p>
            <div className="mt-3"><PlusList items={NVV} /></div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Redemittel — mẫu câu tranh luận (Teil 2)</h3>
            <div className="mt-3"><PlusList items={REDEMITTEL_DISKUSSION} /></div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Redemittel — mẫu câu email (Schreiben)</h3>
            <div className="mt-3"><PlusList items={REDEMITTEL_EMAIL} /></div>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Cụm telc hay ra</h3>
            <div className="mt-3"><PlusList items={TELC_TYPICAL} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
