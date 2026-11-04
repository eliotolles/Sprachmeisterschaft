import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/db";
import { getAllExams } from "@/data/all-exams";
import { useRouter } from "@/lib/router";
import { LookupText } from "@/components/vocabulary/WordDetail";
import { UniversalImportModal } from "@/components/common/UniversalImportModal";
import { parseLessonMarkdown } from "@/lib/lesson-markdown";
import {
  BookOpen,
  Search,
  ArrowRight,
  Flag,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

const BASE = "/skills/reading";
const button =
  "tap rounded-sm border border-border bg-card px-4 py-2 text-sm hover:bg-muted/50 disabled:opacity-50";
const primary =
  "tap rounded-sm border border-accent bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50";
const empty = {
  answers: {},
  flags: {},
  tab: "text",
  scroll: { text: 0, questions: 0 },
};
function read(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* UI remains usable without storage. */
  }
}
const imageURL = (value) => {
  try {
    const u = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
};

function SourceText({ text, evidence = [] }) {
  const render = (value) => {
    const matches = evidence
      .filter(
        (item) => typeof item === "string" && item && value.includes(item),
      )
      .sort((a, b) => b.length - a.length);
    const match = matches[0];
    if (!match) return <LookupText text={value} />;
    const index = value.indexOf(match);
    return (
      <>
        <LookupText text={value.slice(0, index)} />
        <mark className="bg-accent/15 text-foreground">
          <LookupText text={match} />
        </mark>
        <LookupText text={value.slice(index + match.length)} />
      </>
    );
  };
  return parseLessonMarkdown(text).map((block, i) => {
    if (block.type === "table")
      return (
        <div key={i} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.header.map((cell, j) => (
                  <th
                    key={j}
                    scope="col"
                    className="border border-border bg-muted/40 p-3"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr key={j}>
                  {row.map((cell, k) => (
                    <td key={k} className="border border-border p-3">
                      <LookupText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    if (block.type === "heading")
      return (
        <h3 key={i} className="font-heading text-xl font-semibold">
          {render(block.text)}
        </h3>
      );
    if (block.type === "ul" || block.type === "ol") {
      const Tag = block.type;
      return (
        <Tag
          key={i}
          className={
            Tag === "ol"
              ? "list-decimal pl-6 space-y-2"
              : "list-disc pl-6 space-y-2"
          }
        >
          {block.items.map((item, j) => (
            <li key={j}>
              <LookupText text={item} />
            </li>
          ))}
        </Tag>
      );
    }
    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(block.text.trim());
    if (image && imageURL(image[2]))
      return (
        <img
          key={i}
          src={imageURL(image[2])}
          alt={image[1]}
          className="h-auto max-w-full"
          loading="lazy"
        />
      );
    return (
      <p key={i} className="whitespace-pre-wrap">
        {render(block.text)}
      </p>
    );
  });
}
function SourceMedia({ passage }) {
  const images = [
    ...(Array.isArray(passage.images) ? passage.images : []),
    ...(passage.image ? [passage.image] : []),
  ];
  return (
    <>
      {images.map((item, i) => {
        const src = imageURL(
          typeof item === "string" ? item : item?.src || item?.url,
        );
        return src ? (
          <figure key={i}>
            <img
              src={src}
              alt={item?.alt || ""}
              className="h-auto max-w-full"
            />
            {item?.caption && (
              <figcaption className="text-sm text-muted-foreground">
                {item.caption}
              </figcaption>
            )}
          </figure>
        ) : null;
      })}
      {Array.isArray(passage.tables) &&
        passage.tables.map((table, i) => (
          <div key={i} className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              {Array.isArray(table.headers) && (
                <thead>
                  <tr>
                    {table.headers.map((c, j) => (
                      <th
                        scope="col"
                        key={j}
                        className="border border-border p-3"
                      >
                        {String(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {(table.rows || []).map((row, j) => (
                  <tr key={j}>
                    {row.map((c, k) => (
                      <td key={k} className="border border-border p-3">
                        {String(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </>
  );
}

export function ReadingStudio({ onBack }) {
  const { currentPath, navigate } = useRouter();
  const [owner, setOwner] = useState(() => db.auth.getUser()?.id || "guest");
  const storageKey = `sprach_reading_ui:${owner}`;
  const [saved, setSaved] = useState(() =>
    read(storageKey, { attempts: {}, filters: {}, listY: 0 }),
  );
  const [version, setVersion] = useState(0);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const textRef = useRef(null),
    questionsRef = useRef(null);
  const hydrated = useRef(storageKey);
  useEffect(() => {
    const auth = () => {
      const next = db.auth.getUser()?.id || "guest";
      setOwner(next);
      setSaved(
        read(`sprach_reading_ui:${next}`, {
          attempts: {},
          filters: {},
          listY: 0,
        }),
      );
    };
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener("sprach_auth_change", auth);
    window.addEventListener("sprach_db_change", refresh);
    return () => {
      window.removeEventListener("sprach_auth_change", auth);
      window.removeEventListener("sprach_db_change", refresh);
    };
  }, []);
  useEffect(() => {
    if (hydrated.current !== storageKey) {
      hydrated.current = storageKey;
      return;
    }
    write(storageKey, saved);
  }, [saved, storageKey]);
  const passages = useMemo(
    () =>
      getAllExams().flatMap((exam) =>
        (exam.reading || []).map((p, index) => ({
          ...p,
          key: JSON.stringify([String(exam.id), String(p.id ?? index)]),
          examTitle: exam.title,
          level: exam.level || "",
          topic: p.topic || exam.topic || "",
          type: p.type || p.part || "Đọc hiểu",
          title: p.title || `[${exam.title}] ${p.part || `Teil ${index + 1}`}`,
          text: p.passage || p.text || "",
          questions: p.questions || [],
        })),
      ),
    [version, owner],
  );
  const suffix = currentPath.slice(BASE.length).split("/").filter(Boolean);
  let id = "";
  try {
    id = decodeURIComponent(suffix[0] || "");
  } catch {
    /* invalid route */
  }
  const passage = passages.find((p) => p.key === id);
  const fingerprint = passage
    ? JSON.stringify([passage.text, passage.questions])
    : "";
  const stored = passage ? saved.attempts?.[id] : null;
  const attempt = stored?.fingerprint === fingerprint ? stored : empty;
  const result = suffix[1] === "result";
  const filters = {
    search: "",
    level: "",
    topic: "",
    type: "",
    status: "",
    ...saved.filters,
  };
  const update = (patch) =>
    setSaved((previous) => {
      const before = previous.attempts?.[id];
      const valid = before?.fingerprint === fingerprint ? before : empty;
      return {
        ...previous,
        attempts: {
          ...previous.attempts,
          [id]: { ...valid, ...patch, fingerprint, updated: Date.now() },
        },
      };
    });
  const status = (p) => {
    const a = saved.attempts?.[p.key];
    return !a || a.fingerprint !== JSON.stringify([p.text, p.questions])
      ? "new"
      : a.submitted
        ? "done"
        : "progress";
  };
  const labels = {
    new: "Chưa bắt đầu",
    progress: "Đang đọc",
    done: "Đã hoàn thành",
  };
  const go = (p) => {
    setSaved((previous) => {
      const fp = JSON.stringify([p.text, p.questions]);
      const existing = previous.attempts?.[p.key];
      return {
        ...previous,
        listY: window.scrollY,
        attempts: {
          ...previous.attempts,
          [p.key]:
            existing?.fingerprint === fp
              ? existing
              : { ...empty, fingerprint: fp, updated: Date.now() },
        },
      };
    });
    navigate(`${BASE}/${encodeURIComponent(p.key)}`);
  };
  useEffect(() => {
    if (currentPath === BASE) {
      const frame = requestAnimationFrame(() =>
        window.scrollTo({ top: saved.listY || 0, behavior: "instant" }),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [currentPath]);
  useEffect(() => {
    if (!passage) return;
    const frame = requestAnimationFrame(() => {
      if (textRef.current)
        textRef.current.scrollTop = attempt.scroll?.text || 0;
      if (questionsRef.current)
        questionsRef.current.scrollTop = attempt.scroll?.questions || 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [id, attempt.tab, result]);
  const setFilter = (name, value) =>
    setSaved((previous) => ({
      ...previous,
      filters: { ...filters, [name]: value },
      listY: 0,
    }));
  const submit = () => {
    if (attempt.submitted) return;
    let correct = 0;
    passage.questions.forEach((q, idx) => {
      if (attempt.answers[idx] === q.answer) correct++;
    });
    const finalScore = Math.round((correct / passage.questions.length) * 100);
    // Existing grading and activity recording contract, unchanged.
    db.skillSessions.create({
      skill: "reading",
      score: finalScore,
      title: `Đọc hiểu Lesesaal — ${passage.title.slice(0, 30)}`,
      details: `Đúng ${correct}/${passage.questions.length} câu hỏi.`,
      duration_seconds: 300,
    });
    db.studyLogs.recordActivity({ xp: Math.round(finalScore / 5), minutes: 5 });
    update({ submitted: true, score: finalScore });
    navigate(`${BASE}/${encodeURIComponent(id)}/result`);
    toast.success(`Hoàn thành bài đọc! Đạt ${finalScore}%`);
  };
  const retry = (wrongOnly) => {
    const answers = wrongOnly
      ? Object.fromEntries(
          passage.questions.flatMap((q, i) =>
            attempt.answers[i] === q.answer ? [[i, attempt.answers[i]]] : [],
          ),
        )
      : {};
    update({
      answers,
      submitted: false,
      score: undefined,
      tab: "questions",
      scroll: { text: 0, questions: 0 },
    });
    navigate(`${BASE}/${encodeURIComponent(id)}`);
  };
  const card = (p) => (
    <article
      key={p.key}
      className="surface flex flex-col gap-4 rounded-sm border border-border p-5 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono text-accent">
          {[p.level, p.type].filter(Boolean).join(" · ")}
        </span>
        <span className="rounded-sm bg-muted px-2 py-1">
          {labels[status(p)]}
        </span>
      </div>
      <h3 className="font-heading text-xl font-semibold">{p.title}</h3>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {p.description || p.text || p.examTitle}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          {p.questions.length} câu hỏi
        </span>
        <button className={button} onClick={() => go(p)}>
          {status(p) === "progress"
            ? "Tiếp tục"
            : status(p) === "done"
              ? "Đọc lại"
              : "Bắt đầu"}{" "}
          <ArrowRight className="ml-1 inline h-4 w-4" />
        </button>
      </div>
    </article>
  );
  const importModal = (
    <UniversalImportModal
      isOpen={isImportOpen}
      onClose={() => {
        setIsImportOpen(false);
        setVersion((v) => v + 1);
      }}
      defaultType="exam"
    />
  );
  if (!suffix.length) {
    const filtered = passages.filter(
      (p) =>
        (!filters.search ||
          `${p.title} ${p.text} ${p.examTitle}`
            .toLocaleLowerCase()
            .includes(filters.search.toLocaleLowerCase())) &&
        (!filters.level || p.level === filters.level) &&
        (!filters.topic || p.topic === filters.topic) &&
        (!filters.type || p.type === filters.type) &&
        (!filters.status || status(p) === filters.status),
    );
    const ongoing = passages
      .filter((p) => status(p) === "progress")
      .sort(
        (a, b) =>
          (saved.attempts[b.key]?.updated || 0) -
          (saved.attempts[a.key]?.updated || 0),
      );
    return (
      <div className="space-y-7 animate-rise">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="eyebrow mb-2">LESEN / KHÔNG GIAN ĐỌC</div>
            <h1 className="font-display text-4xl font-bold">
              Đọc để hiểu sâu hơn.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Chọn bài đọc, khám phá văn bản và luyện trả lời câu hỏi.
            </p>
          </div>
          <button className={button} onClick={onBack}>
            ← Kỹ năng
          </button>
        </header>
        <section
          className="surface space-y-4 border border-border p-4 md:p-5"
          aria-label="Tìm và lọc bài đọc"
        >
          <label className="flex items-center gap-3 border-b border-border pb-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              aria-label="Tìm bài đọc"
              placeholder="Tìm tên bài hoặc nội dung…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="w-full bg-transparent py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["level", "Cấp độ"],
              ["topic", "Chủ đề"],
              ["type", "Dạng bài"],
              ["status", "Trạng thái"],
            ].map(([name, label]) => (
              <label key={name} className="text-xs text-muted-foreground">
                {label}
                <select
                  className="mt-1 w-full rounded-sm border border-border bg-card p-2.5 text-sm text-foreground"
                  value={filters[name]}
                  onChange={(e) => setFilter(name, e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {(name === "status"
                    ? Object.keys(labels)
                    : [
                        ...new Set(
                          passages.map((p) => p[name]).filter(Boolean),
                        ),
                      ].sort()
                  ).map((value) => (
                    <option key={value} value={value}>
                      {labels[value] || value}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <button
            className="text-xs text-accent underline"
            onClick={() => setSaved((p) => ({ ...p, filters: {}, listY: 0 }))}
          >
            Xóa bộ lọc
          </button>
        </section>
        {ongoing.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold">
              Tiếp tục đọc
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {ongoing.slice(0, 2).map(card)}
            </div>
          </section>
        )}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold">
              Thư viện bài đọc{" "}
              <span className="text-sm text-muted-foreground">
                ({filtered.length})
              </span>
            </h2>
            <button className={button} onClick={() => setIsImportOpen(true)}>
              <Plus className="mr-1 inline h-4 w-4" />
              Import
            </button>
          </div>
          {filtered.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(card)}
            </div>
          ) : (
            <div className="surface border border-dashed border-border p-10 text-center">
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-accent" />
              <p>
                {passages.length
                  ? "Không có bài phù hợp bộ lọc."
                  : "Chưa có bài đọc. Import đề thi để bắt đầu."}
              </p>
            </div>
          )}
        </section>
        {importModal}
      </div>
    );
  }
  if (!passage)
    return (
      <div className="surface space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Không tìm thấy bài đọc</h1>
        <button className={button} onClick={() => navigate(BASE)}>
          ← Danh sách bài đọc
        </button>
      </div>
    );
  const answered = Object.keys(attempt.answers).filter(
    (k) => attempt.answers[k] !== "" && attempt.answers[k] !== undefined,
  ).length;
  const total = passage.questions.length;
  const correct = passage.questions.filter(
    (q, i) => attempt.answers[i] === q.answer,
  ).length;
  const tab = attempt.tab || "text";
  return (
    <div className="space-y-5 animate-rise">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap gap-2 text-sm text-muted-foreground"
      >
        <button
          className="text-accent underline"
          onClick={() => navigate(BASE)}
        >
          Đọc
        </button>
        <span>/</span>
        <span>
          {[passage.level, passage.topic, passage.type]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span>/</span>
        <span>{result ? "Kết quả" : passage.title}</span>
      </nav>
      <header className="surface space-y-2 border border-border p-5 md:p-7">
        <div className="eyebrow">{passage.examTitle}</div>
        <h1 className="font-display text-3xl font-bold">{passage.title}</h1>
        {(passage.instructions || passage.instruction) && (
          <p className="text-sm text-muted-foreground">
            {passage.instructions || passage.instruction}
          </p>
        )}
        {passage.minutes && (
          <p className="text-xs text-muted-foreground">
            Thời gian theo nguồn: {passage.minutes} phút
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {total} câu hỏi · Nhấp hoặc chọn từ trong văn bản để tra nghĩa.
        </p>
      </header>
      {result && !attempt.submitted && (
        <div
          role="status"
          className="surface space-y-3 border border-border p-5"
        >
          <p>Chưa có kết quả cho bài này trên phiên hiện tại.</p>
          <button
            className={primary}
            onClick={() => navigate(`${BASE}/${encodeURIComponent(id)}`)}
          >
            Tiếp tục làm bài
          </button>
        </div>
      )}
      {result && attempt.submitted && (
        <section className="surface space-y-4 border border-accent/40 p-6">
          <div className="eyebrow">KẾT QUẢ BÀI ĐỌC</div>
          <div className="flex flex-wrap items-end gap-6">
            <strong className="font-display text-5xl text-accent">
              {attempt.score}%
            </strong>
            <p>
              {correct} đúng · {total - answered} bỏ trống ·{" "}
              {answered - correct} sai
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className={button}
              onClick={() => navigate(`${BASE}/${encodeURIComponent(id)}`)}
            >
              Đọc lại văn bản
            </button>
            <button
              className={primary}
              disabled={correct === total}
              onClick={() => retry(true)}
            >
              Làm lại câu sai / bỏ trống
            </button>
            <button className={button} onClick={() => retry(false)}>
              Làm lại toàn bài
            </button>
          </div>
        </section>
      )}
      <div
        role="tablist"
        aria-label="Khu vực bài đọc"
        className="sticky top-0 z-10 grid grid-cols-2 border border-border bg-card lg:hidden"
      >
        {[
          ["text", "Văn bản"],
          ["questions", result ? "Đáp án" : "Câu hỏi"],
        ].map(([key, label]) => (
          <button
            key={key}
            id={`reading-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            aria-controls={`reading-panel-${key}`}
            className={`tap border-b-2 p-3 text-sm ${tab === key ? "border-accent text-accent" : "border-transparent"}`}
            onClick={() => update({ tab: key })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section
          id="reading-panel-text"
          aria-label="Văn bản"
          ref={textRef}
          onScroll={(e) =>
            update({
              scroll: { ...attempt.scroll, text: e.currentTarget.scrollTop },
            })
          }
          className={`${tab === "text" ? "block" : "hidden"} surface max-h-[72dvh] overflow-auto rounded-sm border border-border p-5 md:p-8 lg:sticky lg:top-4 lg:block lg:max-h-[80dvh]`}
        >
          <h2 className="mb-6 font-heading text-2xl font-semibold">
            {passage.title}
          </h2>
          <div
            lang="de"
            className="mx-auto max-w-[70ch] space-y-5 font-body text-base leading-[1.85]"
          >
            <SourceText
              text={passage.text}
              evidence={
                attempt.submitted
                  ? passage.questions.map((q) => q.evidence)
                  : []
              }
            />
            <SourceMedia passage={passage} />
          </div>
        </section>
        <section
          id="reading-panel-questions"
          aria-label="Câu hỏi"
          ref={questionsRef}
          onScroll={(e) =>
            update({
              scroll: {
                ...attempt.scroll,
                questions: e.currentTarget.scrollTop,
              },
            })
          }
          className={`${tab === "questions" ? "block" : "hidden"} surface max-h-[72dvh] space-y-6 overflow-auto rounded-sm border border-border p-5 md:p-7 lg:block lg:max-h-[80dvh]`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold">
              {result ? "Đối chiếu đáp án" : "Câu hỏi"}
            </h2>
            <span className="text-xs text-muted-foreground">
              {answered}/{total} đã trả lời
            </span>
          </div>
          <nav aria-label="Điều hướng câu hỏi" className="flex flex-wrap gap-2">
            {passage.questions.map((q, i) => (
              <button
                key={i}
                aria-label={`Câu ${i + 1}${attempt.flags[i] ? ", đã đánh dấu" : ""}`}
                className={`tap h-9 min-w-9 border text-sm ${attempt.flags[i] ? "border-accent ring-1 ring-accent" : "border-border"} ${attempt.answers[i] !== undefined ? "bg-accent/10 text-accent" : "bg-card"}`}
                onClick={() =>
                  document
                    .getElementById(`reading-q-${i}`)
                    ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
                }
              >
                {i + 1}
                {attempt.flags[i] ? " •" : ""}
              </button>
            ))}
          </nav>
          {passage.questions.map((q, i) => {
            const chosen = attempt.answers[i],
              ok = chosen === q.answer;
            return (
              <article
                id={`reading-q-${i}`}
                key={i}
                className="scroll-mt-4 space-y-3 border-t border-border pt-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading font-semibold">
                    {i + 1}. {q.q || q.question}
                  </h3>
                  <button
                    className={`tap shrink-0 p-1 ${attempt.flags[i] ? "text-accent" : "text-muted-foreground"}`}
                    aria-label={`Đánh dấu xem lại câu ${i + 1}`}
                    aria-pressed={Boolean(attempt.flags[i])}
                    onClick={() =>
                      update({
                        flags: { ...attempt.flags, [i]: !attempt.flags[i] },
                      })
                    }
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
                {q.instructions && (
                  <p className="text-sm text-muted-foreground">
                    {q.instructions}
                  </p>
                )}
                {Array.isArray(q.options) && q.options.length ? (
                  <div
                    role="group"
                    aria-label={`Lựa chọn câu ${i + 1}`}
                    className="space-y-2"
                  >
                    {q.options.map((option, j) => (
                      <button
                        key={j}
                        disabled={attempt.submitted}
                        aria-pressed={chosen === option}
                        onClick={() =>
                          update({
                            answers: { ...attempt.answers, [i]: option },
                          })
                        }
                        className={`tap flex w-full items-start gap-3 rounded-sm border p-3 text-left text-sm ${attempt.submitted && option === q.answer ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" : chosen === option ? "border-accent bg-accent/10 text-accent" : "border-border bg-card hover:bg-muted/30"}`}
                      >
                        <span className="font-mono text-xs">
                          {String.fromCharCode(65 + j)}.
                        </span>
                        <span>{option}</span>
                        {attempt.submitted && option === q.answer && (
                          <CheckCircle2 className="ml-auto h-4 w-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <label className="block text-sm">
                    Câu trả lời
                    <input
                      value={chosen ?? ""}
                      disabled={attempt.submitted}
                      onChange={(e) =>
                        update({
                          answers: { ...attempt.answers, [i]: e.target.value },
                        })
                      }
                      className="mt-2 w-full rounded-sm border border-border bg-card p-3"
                    />
                  </label>
                )}
                {attempt.submitted && (
                  <div className="space-y-2 rounded-sm bg-muted/40 p-3 text-sm">
                    <strong
                      className={
                        ok
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-accent"
                      }
                    >
                      {chosen === undefined || chosen === ""
                        ? "Bỏ trống"
                        : ok
                          ? "Đúng"
                          : "Sai"}
                    </strong>
                    <p>
                      Bạn chọn:{" "}
                      {chosen === undefined || chosen === ""
                        ? "Chưa trả lời"
                        : String(chosen)}
                    </p>
                    <p>Đáp án đúng: {String(q.answer ?? "")}</p>
                    {q.explanation && (
                      <p className="leading-relaxed">{q.explanation}</p>
                    )}
                    {typeof q.evidence === "string" && q.evidence && (
                      <blockquote className="border-l-2 border-accent pl-3">
                        <mark className="bg-accent/10 text-foreground">
                          {q.evidence}
                        </mark>
                      </blockquote>
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {!attempt.submitted && (
            <div className="sticky bottom-0 space-y-2 border-t border-border bg-card py-4">
              <p className="text-xs text-muted-foreground">
                {total - answered} câu chưa trả lời. Hoàn tất các câu để nộp
                bài.
              </p>
              <button
                className={`${primary} w-full`}
                disabled={!total || answered < total}
                onClick={submit}
              >
                Nộp bài chấm điểm
              </button>
            </div>
          )}
          {attempt.submitted && !result && (
            <button
              className={`${primary} w-full`}
              onClick={() =>
                navigate(`${BASE}/${encodeURIComponent(id)}/result`)
              }
            >
              Xem kết quả
            </button>
          )}
        </section>
      </div>
      {importModal}
    </div>
  );
}
