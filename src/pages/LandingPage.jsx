import React, { useState } from 'react';
import { db } from '@/lib/db';
import { useRouter, Link } from '@/lib/router';
import {
  BookOpen,
  Sparkles,
  Volume2,
  CheckCircle2,
  Brain,
  Award,
  Compass,
  FileCheck2,
  Gamepad2,
  MessageSquare,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Flame,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LEVELS } from '@/data/levels';

const SAMPLE_WORDS = [
  { german: 'Apfel', article: 'der', meaning: 'quả táo', example: 'Ich esse einen roten Apfel.' },
  { german: 'Sonne', article: 'die', meaning: 'mặt trời', example: 'Die Sonne scheint heute hell.' },
  { german: 'Buch', article: 'das', meaning: 'cuốn sách', example: 'Das Buch liegt auf dem Tisch.' },
  { german: 'Mädchen', article: 'das', meaning: 'bé gái / cô gái', example: 'Das Mädchen lernt fleißig Deutsch.' },
  { german: 'Kaffee', article: 'der', meaning: 'cà phê', example: 'Möchtest du eine Tasse Kaffee?' },
];

export function LandingPage() {
  const { navigate } = useRouter();

  // Interactive Mini-Demo state
  const [wordIndex, setWordIndex] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [demoScore, setDemoScore] = useState(0);

  const currentWord = SAMPLE_WORDS[wordIndex];

  const handleSpeak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectArticle = (art) => {
    if (selectedArticle !== null) return;
    setSelectedArticle(art);
    const isCorrect = art === currentWord.article;
    if (isCorrect) {
      setDemoScore((s) => s + 10);
      handleSpeak(`${art} ${currentWord.german}`);
    } else {
      handleSpeak(`${currentWord.article} ${currentWord.german}`);
    }
  };

  const handleNextWord = () => {
    setSelectedArticle(null);
    setWordIndex((i) => (i + 1) % SAMPLE_WORDS.length);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent/20 selection:text-accent relative overflow-x-hidden grain">
      {/* Classical ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none animate-float" />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Wordmark */}
          <Link to="/landing" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full wax-seal text-white font-display font-bold text-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <div className="font-display font-bold text-lg sm:text-xl tracking-tight text-foreground leading-none">
                Sprachmeisterschaft
              </div>
              <div className="text-[10px] font-mono tracking-widest text-accent uppercase mt-0.5">
                DEUTSCHMASTER · A1–C2
              </div>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono">
            <a href="#features" className="text-muted-foreground hover:text-accent transition-colors">
              Hệ thống 7 Kỹ năng
            </a>
            <a href="#demo" className="text-muted-foreground hover:text-accent transition-colors">
              Thử nghiệm Minigame
            </a>
            <a href="#levels" className="text-muted-foreground hover:text-accent transition-colors">
              Khung CEFR
            </a>
            <a href="#exams" className="text-muted-foreground hover:text-accent transition-colors">
              9 Đề thi chính thức
            </a>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <Link
              to="/login"
              className="tap hidden sm:inline-flex px-3.5 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono font-medium transition-colors"
            >
              Đăng nhập
            </Link>

            <Link
              to="/register"
              className="tap px-4 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm transition-all hover:shadow"
            >
              Bắt đầu học
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN HERO SECTION (BÌA ẤN PHẨM CỔ ĐIỂN) */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          {/* Classical Book Cover Frontispiece Frame */}
          <div className="surface p-6 sm:p-10 md:p-14 relative border-2 border-border shadow-2xl animate-rise">
            {/* Antique corner accents */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-accent" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-accent" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-accent" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-accent" />

            <div className="text-center max-w-3xl mx-auto">
              {/* Wax Seal Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent/5 mb-6 animate-float">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                  Ấn bản học thuật chính quy · Chuẩn hóa 2026
                </span>
              </div>

              {/* Eyebrow */}
              <div className="eyebrow mb-2">HỆ THỐNG TỰ HỌC TIẾNG ĐỨC CHUYÊN SÂU DÀNH CHO NGƯỜI VIỆT</div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.08] mb-4">
                Sprachmeisterschaft
              </h1>

              {/* German Subtitle */}
              <p className="font-heading italic text-lg sm:text-xl text-accent mb-6 font-medium">
                „Der Königsweg zur deutschen Sprache — Chinh phục tiếng Đức từ A1 đến C2“
              </p>

              {/* Double rule separator */}
              <div className="rule-double max-w-md mx-auto my-6" />

              {/* Descriptive Paragraph */}
              <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
                Phương pháp ghi nhớ vĩnh viễn với thuật toán lặp lại ngắt quãng <strong>SRS SM-2</strong>,
                rèn luyện toàn diện <strong>7 xưởng kỹ năng</strong> ngôn ngữ, phản xạ thần tốc mạo từ
                <strong> Der / Die / Das</strong>, cọ xát <strong>9 bộ đề thi chuẩn CEFR</strong>, và gia sư trí tuệ nhân tạo <strong>ELIO</strong> đồng hành 24/7.
              </p>

              {/* AUTHENTICATION ACTION CLUSTER */}
              <div className="max-w-md mx-auto space-y-3 mb-8">
                {/* 1. GOOGLE LOGIN BUTTON (PRIORITY) */}
                <GoogleButton
                  label="Đăng nhập tức thì bằng Google"
                  className="shadow-md hover:border-accent"
                />

                {/* 2. Secondary CTA buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Link
                    to="/register"
                    className="tap flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm transition-all hover:shadow"
                  >
                    <span>Đăng ký tài khoản mới</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to="/login"
                    className="tap flex items-center justify-center gap-2 py-2.5 px-4 rounded-sm border border-border bg-card hover:bg-muted text-foreground font-mono text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Đăng nhập hệ thống</span>
                  </Link>
                </div>
              </div>

              {/* Guarantee badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 border-t border-border/80 text-xs font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>950+ Từ vựng nạp sẵn</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Thuật toán SRS SM-2</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>9 Đề Goethe, telc, ÖSD, DTZ</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>Không quảng cáo</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE MINI DEMO SECTION ("PHÒNG THÍ NGHIỆM THỰC HÀNH NGAY") */}
      <section id="demo" className="py-16 px-4 sm:px-6 bg-card/40 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="eyebrow mb-1">Trải nghiệm tương tác trực tiếp</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Rèn trực giác Der / Die / Das
            </h2>
            <p className="font-heading italic text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
              Không cần đăng nhập — hãy thử tài bấm chọn mạo từ chính xác cho từ vựng mẫu dưới đây
            </p>
            <div className="rule-double max-w-xs mx-auto mt-3" />
          </div>

          {/* Interactive Card */}
          <div className="surface p-6 sm:p-8 max-w-xl mx-auto border border-border shadow-lg relative">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
              <span className="text-xs font-mono text-muted-foreground">
                Từ mẫu #{wordIndex + 1} / {SAMPLE_WORDS.length}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-accent/10 border border-accent/20 text-accent font-mono text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                <span>Điểm thử nghiệm: {demoScore} XP</span>
              </div>
            </div>

            {/* Word Display */}
            <div className="text-center py-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                  {selectedArticle ? (
                    <span>
                      <span
                        className={
                          currentWord.article === 'der'
                            ? 'text-blue-700 dark:text-blue-400 font-extrabold mr-2'
                            : currentWord.article === 'die'
                            ? 'text-rose-700 dark:text-rose-400 font-extrabold mr-2'
                            : 'text-amber-700 dark:text-amber-400 font-extrabold mr-2'
                        }
                      >
                        {currentWord.article}
                      </span>
                      {currentWord.german}
                    </span>
                  ) : (
                    <span>??? {currentWord.german}</span>
                  )}
                </h3>

                <button
                  type="button"
                  onClick={() => handleSpeak(`${currentWord.article} ${currentWord.german}`)}
                  title="Nghe phát âm chuẩn"
                  className="tap p-2 rounded-full hover:bg-muted text-accent transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <p className="font-heading italic text-muted-foreground text-sm">
                Nghĩa: {currentWord.meaning}
              </p>

              {/* Example sentence */}
              {selectedArticle && (
                <div className="mt-4 p-3 rounded-sm bg-muted/50 border border-border text-xs font-body animate-fade-in text-left">
                  <div className="text-foreground font-medium mb-0.5">
                    "{currentWord.example}"
                  </div>
                  <div className="text-muted-foreground italic">
                    (Ví dụ ngữ cảnh thực tế)
                  </div>
                </div>
              )}
            </div>

            {/* 3 Article Buttons */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {['der', 'die', 'das'].map((art) => {
                const isChosen = selectedArticle === art;
                const isCorrect = art === currentWord.article;

                let btnStyle = 'border-border bg-card hover:bg-muted text-foreground';
                if (selectedArticle) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500';
                  } else if (isChosen && !isCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300';
                  } else {
                    btnStyle = 'opacity-40 border-border bg-card';
                  }
                }

                return (
                  <button
                    key={art}
                    type="button"
                    disabled={selectedArticle !== null}
                    onClick={() => handleSelectArticle(art)}
                    className={`tap py-3 px-4 rounded-sm border font-display text-xl font-bold transition-all ${btnStyle}`}
                  >
                    {art}
                  </button>
                );
              })}
            </div>

            {/* Action next */}
            {selectedArticle && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {selectedArticle === currentWord.article ? '✓ Rất chính xác!' : '✗ Hãy ghi nhớ mạo từ chuẩn!'}
                </span>

                <button
                  type="button"
                  onClick={handleNextWord}
                  className="tap px-4 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>Từ tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7 CORE PILLARS SECTION */}
      <section id="features" className="py-20 px-4 sm:px-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="eyebrow mb-1">Cấu trúc nền tảng</div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              7 Trụ cột học thuật chuyên sâu
            </h2>
            <p className="font-heading italic text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl mx-auto">
              Được thiết kế tỉ mỉ dựa trên nghiên cứu thần kinh học nhận thức và tiêu chuẩn bài thi Viện Goethe
            </p>
            <div className="rule-double max-w-sm mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="surface p-6 border border-border hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <div className="eyebrow mb-1">Thuật toán SM-2</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Ôn thẻ ngắt quãng (SRS)
              </h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Tự động tính toán điểm quên theo đường cong Ebbinghaus. 4 mức phản hồi (Quên, Khó, Được, Dễ)
                giúp tối ưu hóa lịch ôn tập từng ngày cho hơn 950 từ vựng.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="surface p-6 border border-border hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div className="eyebrow mb-1">Xưởng thực hành</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                7 Kỹ năng ngôn ngữ
              </h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Không chỉ học ngữ pháp thụ động: luyện Nghe audio chuẩn bản xứ, Đọc hiểu văn bản, Viết thư có chấm điểm AI,
                Luyện nói và Phỏng vấn xin việc/visa B1–B2.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="surface p-6 border border-border hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="eyebrow mb-1">Minigame phản xạ</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Đấu trường Der / Die / Das
              </h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Chinh phục nỗi ám ảnh lớn nhất của người học tiếng Đức với trò chơi tính giờ,
                hệ thống nhân điểm combo liên hoàn và bảng thành tích học thuật.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="surface p-6 border border-border hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="eyebrow mb-1">Khảo thí chuẩn quốc tế</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                9 Đề thi mô phỏng CEFR
              </h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Mô phỏng trọn vẹn format đề thi Goethe-Zertifikat A1–C2, telc B1, ÖSD B1 và kỳ thi hội nhập DTZ B1.
                Chấm điểm trắc nghiệm tức thì và nhận xét bài viết.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="surface p-6 border border-border hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="eyebrow mb-1">Gia sư AI 24/7</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                ELIO (KI-Tutor)
              </h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Gia sư trí tuệ nhân tạo chuyên sâu tiếng Đức: phân tích ngữ pháp tiếng Đức bằng tiếng Việt dễ hiểu,
                sửa lỗi diễn đạt trong bài viết và hội thoại phản xạ theo chủ đề.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="surface p-6 border border-border hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
              <div className="w-10 h-10 rounded-sm bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="eyebrow mb-1">Dự báo đỗ trượt</div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                Chỉ số sẵn sàng thi
              </h3>
              <p className="font-body text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Mô hình radar 5 chiều lượng hóa độ chín muồi của vốn từ, độ đều đặn học tập, điểm đề thi và tốc độ phản xạ
                để dự báo chính xác ngày bạn sẵn sàng đi thi thật.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CEFR LEVELS OVERVIEW SECTION */}
      <section id="levels" className="py-20 px-4 sm:px-6 bg-card/40 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="eyebrow mb-1">Lộ trình học tập chuẩn châu Âu</div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
              Khung năng lực ngôn ngữ A1–C2
            </h2>
            <p className="font-heading italic text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
              Hệ thống chia nhỏ từng cấp độ với mục tiêu chứng chỉ rõ ràng
            </p>
            <div className="rule-double max-w-xs mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {LEVELS.map((lvl) => (
              <div
                key={lvl.id}
                className="surface p-4 text-center border border-border hover:border-accent/50 transition-all"
              >
                <div className="font-display text-2xl font-bold text-accent mb-1">
                  {lvl.id}
                </div>
                <div className="font-display text-xs font-semibold text-foreground mb-1 line-clamp-1">
                  {lvl.label}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground mb-2 italic">
                  {lvl.de}
                </div>
                <div className="pt-2 border-t border-border text-[10px] font-mono text-accent">
                  Mục tiêu: {lvl.vocabTarget} từ
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto surface p-8 sm:p-12 border-2 border-accent/40 shadow-2xl relative text-center">
          <div className="w-14 h-14 rounded-full wax-seal text-white font-display text-2xl font-bold mx-auto mb-4 flex items-center justify-center shadow-lg animate-float">
            S
          </div>

          <div className="eyebrow mb-2">BẮT ĐẦU NGAY HÔM NAY</div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Sẵn sàng làm chủ tiếng Đức?
          </h2>
          <p className="font-heading italic text-muted-foreground max-w-xl mx-auto mb-8 text-sm sm:text-base">
            „Aller Anfang ist schwer, am Ende siegt der Fleiß — Vạn sự khởi đầu nan, kiên trì ắt thắng.“
          </p>

          <div className="max-w-md mx-auto space-y-3">
            <GoogleButton label="Đăng nhập ngay với Google" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                to="/register"
                className="tap py-2.5 px-4 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
              >
                <span>Đăng ký tài khoản</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/login"
                className="tap py-2.5 px-4 rounded-sm border border-border bg-card hover:bg-muted text-foreground font-mono text-xs font-medium flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Đăng nhập hệ thống</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* EDITORIAL FOOTER */}
      <footer className="border-t border-border py-10 px-4 sm:px-6 text-xs font-mono text-muted-foreground bg-card/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-display text-sm font-bold text-foreground">
              Sprachmeisterschaft · DeutschMaster
            </div>
            <div className="text-[11px] mt-0.5">
              Nền tảng tự học tiếng Đức A1–C2 dành cho người Việt theo chuẩn CEFR.
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/landing" className="hover:text-accent transition-colors">
              Trang bìa
            </Link>
            <Link to="/login" className="hover:text-accent transition-colors">
              Đăng nhập
            </Link>
            <Link to="/register" className="hover:text-accent transition-colors">
              Đăng ký
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default LandingPage;
