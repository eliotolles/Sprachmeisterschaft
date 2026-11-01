import React, { useState } from 'react';
import { db } from '@/lib/db';
import {
  X,
  UploadCloud,
  FileText,
  Youtube,
  Globe,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { LEVEL_IDS } from '@/data/levels';
import { toast } from 'sonner';

export function UniversalImportModal({ isOpen, onClose, defaultType = 'vocabulary', onSuccess }) {
  const [contentType, setContentType] = useState(defaultType);
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('B1');
  const [scope, setScope] = useState('public');
  const [rawContent, setRawContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawSubtitles, setRawSubtitles] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = db.auth.getUser();
  const isAdmin = db.auth.isAdmin();

  if (!isOpen) return null;

  // Helper to extract YouTube Video ID
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  // Helper to parse SRT / timestamp text
  const parseSubtitles = (text) => {
    if (!text.trim()) return [];
    const lines = text.split('\n');
    const subs = [];
    let curTime = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check format: 0:05 - Wie lange lernen Sie schon Deutsch?
      const match = line.match(/^(\d+):(\d+)\s*[-:]\s*(.*?)(?:\s*\|\s*(.*))?$/);
      if (match) {
        const startSec = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        subs.push({
          id: `sub_${subs.length + 1}`,
          start: startSec,
          end: startSec + 4,
          de: match[3].trim(),
          vi: match[4] ? match[4].trim() : '',
        });
        continue;
      }

      // Simple text line
      subs.push({
        id: `sub_${subs.length + 1}`,
        start: curTime,
        end: curTime + 4,
        de: line,
        vi: '',
      });
      curTime += 4;
    }
    return subs;
  };

  const handleImport = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho bộ nội dung!');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. IMPORT LISTENING VIDEO
      if (contentType === 'listening') {
        const ytId = extractYouTubeId(youtubeUrl);
        const parsedSubs = parseSubtitles(rawSubtitles);
        const effectiveScope = scope; // Allow user choice

        let targetCollectionId = 'nicos-weg-a1';

        if (effectiveScope === 'private') {
          // Put in user's personal collection
          let myCol = db.listening.getCollections({ scope: 'private' }).find((c) => c.id === 'my-personal-videos');
          if (!myCol) {
            myCol = db.listening.createCollection({
              id: 'my-personal-videos',
              title: 'Kho Video Cá Nhân Của Tôi',
              deTitle: 'Meine persönliche Videosammlung',
              provider: 'Video của tôi',
              level,
              thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
              description: 'Các video YouTube do bạn tự nhập để luyện nghe và chép chính tả riêng.',
              scope: 'private',
            });
          }
          targetCollectionId = myCol.id;
        } else {
          // Public or Admin Only: Create a new visible collection for the app
          const newCol = db.listening.createCollection({
            title,
            deTitle: title,
            provider: 'Elio Einfach Official',
            level,
            thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
            description: `Bộ luyện nghe video cấp độ ${level}: ${title}`,
            scope: effectiveScope,
          });
          targetCollectionId = newCol.id;
        }

        const newEpisode = db.listening.createEpisode({
          collectionId: targetCollectionId,
          title,
          level,
          youtubeId: ytId || '4-eDoThe6qo',
          subtitles: parsedSubs.length > 0 ? parsedSubs : [
            { id: 'sub-1', start: 0, end: 5, de: title, vi: 'Nội dung video' },
          ],
          scope: effectiveScope,
        });

        toast.success(
          `Đã import thành công video luyện nghe: "${title}" vào ${
            effectiveScope === 'public'
              ? 'Kho chung toàn hệ thống'
              : effectiveScope === 'private'
              ? 'Kho cá nhân của bạn'
              : 'Nội bộ Admin'
          }!`
        );
      }
      // 2. IMPORT VOCABULARY
      else if (contentType === 'vocabulary') {
        const lines = rawContent.split('\n');
        let importedCount = 0;

        for (const line of lines) {
          if (!line.trim()) continue;
          // Format: [der/die/das] Từ Đức - Nghĩa tiếng Việt - Ví dụ
          const parts = line.split(/[-–|]/);
          let germanFull = (parts[0] || '').trim();
          let vietnamese = (parts[1] || '').trim();
          let example_de = (parts[2] || '').trim();

          let article = '';
          let german = germanFull;
          if (germanFull.toLowerCase().startsWith('der ')) {
            article = 'der';
            german = germanFull.substring(4);
          } else if (germanFull.toLowerCase().startsWith('die ')) {
            article = 'die';
            german = germanFull.substring(4);
          } else if (germanFull.toLowerCase().startsWith('das ')) {
            article = 'das';
            german = germanFull.substring(4);
          }

          if (german && vietnamese) {
            db.vocabulary.create({
              german,
              article,
              vietnamese,
              example_de,
              level,
              topic: title,
            });
            importedCount++;
          }
        }

        db.universal.create({
          type: 'vocabulary',
          title,
          level,
          data: { raw: rawContent, count: importedCount },
          scope: isAdmin ? scope : 'private',
        });

        toast.success(`Đã nạp thành công ${importedCount} từ vựng vào cấp độ ${level}!`);
      }
      // 3. OTHER SKILLS & EXAMS
      else {
        db.universal.create({
          type: contentType,
          title,
          level,
          data: { content: rawContent },
          scope: isAdmin ? scope : 'private',
        });
        toast.success(`Đã import thành công nội dung ${contentType.toUpperCase()}: "${title}"!`);
      }

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      toast.error('Có lỗi xảy ra khi import: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="surface max-w-2xl w-full p-6 sm:p-8 relative border-2 border-border shadow-2xl animate-rise my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border mb-6">
          <div>
            <div className="eyebrow mb-1">TRUNG TÂM IMPORT HỌC THUẬT</div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Nhập nội dung mới vào hệ thống
            </h2>
            <p className="font-heading italic text-xs text-muted-foreground mt-0.5">
              Hỗ trợ nạp Từ vựng, Video Nghe YouTube kèm phụ đề, Đọc hiểu, Viết, Nói và Đề thi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleImport} className="space-y-4">
          {/* 1. Category and Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Loại nội dung cần nạp *
              </label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground font-mono"
              >
                <option value="vocabulary">📚 Bộ từ vựng theo cấp độ</option>
                <option value="listening">🎧 Kỹ năng Nghe (YouTube Video / Playlist)</option>
                <option value="reading">📖 Kỹ năng Đọc hiểu văn bản</option>
                <option value="writing">✍️ Kỹ năng Viết (Đề bài & Bài mẫu)</option>
                <option value="speaking">🗣️ Kỹ năng Nói & Phát âm</option>
                <option value="grammar">🧩 Chuyên đề Ngữ pháp</option>
                <option value="interview">🎙️ Kỹ năng Phỏng vấn (Visa / Việc làm)</option>
                <option value="exam">📜 Đề thi mô phỏng CEFR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Cấp độ chuẩn hóa (CEFR) *
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground font-mono font-bold text-accent"
              >
                {LEVEL_IDS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Trình độ {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Title */}
          <div>
            <label className="block text-xs font-mono font-medium text-foreground mb-1">
              Tiêu đề bộ nội dung *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Nicos Weg Tập 5 / Từ vựng B1 Môi trường / Đề thi thử Goethe B2"
              className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground font-heading"
            />
          </div>

          {/* 3. Scope Permissions Selector */}
          <div className="p-3.5 bg-muted/30 rounded-sm border border-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-medium text-foreground">
                Quyền phân phối & Hiển thị (Scope) *
              </label>
              <span className="text-[10px] font-mono text-accent font-bold px-1.5 py-0.5 rounded bg-accent/10">
                Lựa chọn phạm vi xuất bản
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('public')}
                className={`tap p-2.5 rounded-sm border text-left text-xs font-mono transition-all flex items-start gap-2 ${
                  scope === 'public'
                    ? 'border-accent bg-accent/10 text-accent font-semibold ring-1 ring-accent'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">🌍 Toàn hệ thống</div>
                  <div className="text-[10px] text-muted-foreground">Xuất bản kho chung cho mọi học viên</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('private')}
                className={`tap p-2.5 rounded-sm border text-left text-xs font-mono transition-all flex items-start gap-2 ${
                  scope === 'private'
                    ? 'border-accent bg-accent/10 text-accent font-semibold ring-1 ring-accent'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">👤 Video cá nhân</div>
                  <div className="text-[10px] text-muted-foreground">Lưu riêng vào kho cá nhân của bạn</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope('admin_only')}
                className={`tap p-2.5 rounded-sm border text-left text-xs font-mono transition-all flex items-start gap-2 ${
                  scope === 'admin_only'
                    ? 'border-accent bg-accent/10 text-accent font-semibold ring-1 ring-accent'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">🔒 Nội bộ Admin</div>
                  <div className="text-[10px] text-muted-foreground">Chỉ ban quản trị kiểm duyệt</div>
                </div>
              </button>
            </div>
          </div>

          {/* 4. CONTENT SPECIFIC INPUTS */}
          {contentType === 'listening' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1 flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5 text-rose-600" />
                  <span>Đường link YouTube Video hoặc YouTube ID *</span>
                </label>
                <input
                  type="text"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=4-eDoThe6qo hoặc 4-eDoThe6qo"
                  className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-medium text-foreground">
                    Phụ đề kèm timestamp (Định dạng: <code>Phút:Giây - Tiếng Đức | Tiếng Việt</code>)
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">Không bắt buộc</span>
                </div>
                <textarea
                  rows={6}
                  value={rawSubtitles}
                  onChange={(e) => setRawSubtitles(e.target.value)}
                  placeholder={`0:05 - Wie lange lernen Sie schon Deutsch? | Bạn học tiếng Đức bao lâu rồi?\n0:08 - Ich lerne seit einem Jahr Deutsch. | Tôi học được một năm rồi.\n0:14 - Richtig, ich weiß das! | Đúng rồi, tôi biết điều đó!`}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                />
              </div>
            </div>
          ) : contentType === 'vocabulary' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono font-medium text-foreground">
                  Danh sách từ vựng (Định dạng: <code>[Mạo từ] Từ Đức - Nghĩa tiếng Việt - Câu ví dụ</code>)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setRawContent(
                      `der Apfel - quả táo - Ich esse einen Apfel.\ndie Sonne - mặt trời - Die Sonne scheint.\ndas Buch - cuốn sách - Das Buch ist sehr interessant.`
                    )
                  }
                  className="text-[10px] font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Điền mẫu nhanh</span>
                </button>
              </div>
              <textarea
                rows={7}
                required
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder={`der Vater - người bố - Mein Vater ist Ingenieur.\ndie Mutter - người mẹ - Meine Mutter kocht gut.\ndas Kind - đứa con - Das Kind geht zur Schule.`}
                className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono font-medium text-foreground mb-1">
                Nội dung chi tiết (Văn bản, Đề bài hoặc JSON cấu trúc)
              </label>
              <textarea
                rows={6}
                required
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Nhập nội dung đề bài, câu hỏi trắc nghiệm hoặc bài văn tiếng Đức kèm hướng dẫn..."
                className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tap px-4 py-2 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-foreground"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="tap px-6 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang nạp...' : 'Xác nhận Import'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default UniversalImportModal;
