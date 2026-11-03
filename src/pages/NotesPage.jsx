import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText, Plus, Trash2, Edit3, Save, X, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export function NotesPage() {
  const scope = useRef(0), saving = useRef(false), account = useRef(db.auth.getUser()?.id);
  const { navigate } = useRouter();
  const [notes, setNotes] = useState(() => db.notes.findMany());
  const [filterType, setFilterType] = useState('all');
  const [editingNote, setEditingNote] = useState(null); // null, 'new', or existing note object

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('note');

  useEffect(() => {
    const handleDbChange = () => {
      setNotes(db.notes.findMany());
    };
    const accountChanged = () => { const id=db.auth.getUser()?.id; if(id===account.current)return; account.current=id; scope.current++; saving.current=false; setEditingNote(null); setTitle(''); setContent(''); setType('note'); handleDbChange(); };
    window.addEventListener('sprach_db_change', handleDbChange);
    window.addEventListener('sprach_auth_change', accountChanged);
    return () => { scope.current++; window.removeEventListener('sprach_db_change', handleDbChange); window.removeEventListener('sprach_auth_change', accountChanged); };
  }, []);

  const filteredNotes = notes.filter((n) => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  const handleOpenNew = () => {
    setTitle('');
    setContent('');
    setType('note');
    setEditingNote('new');
  };

  const handleOpenEdit = (n) => {
    setTitle(n.title);
    setContent(n.content || '');
    setType(n.type || 'note');
    setEditingNote(n);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề ghi chú.');
      return;
    }

    if(saving.current)return;
    const current=scope.current; saving.current=true;
    try {
    if (editingNote === 'new') {
      await db.notes.create({ title: title.trim(), content, type });
      if(current!==scope.current)return;
      toast.success('Đã tạo ghi chú mới.');
    } else if (editingNote?.id) {
      await db.notes.update(editingNote.id, { title: title.trim(), content, type });
      if(current!==scope.current)return;
      toast.success('Đã cập nhật ghi chú.');
    }

    if(current===scope.current)setEditingNote(null);
    } catch(error) { if(current===scope.current)toast.error(error.message); } finally { if(current===scope.current)saving.current=false; }
  };

  const handleDelete = async (id) => {
    const current=scope.current;
    try { await db.notes.delete(id); if(current===scope.current)toast.success('Đã xoá ghi chú.'); }
    catch(error) { if(current===scope.current)toast.error(error.message); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-rise">
      <PageHeader
        eyebrow="SỔ TAY CÁ NHÂN"
        title="Ghi chú & Tài liệu học"
        deTitle="Notizen"
        subtitle="Lưu lại dàn ý bài viết thư, điểm ngữ pháp cần nhớ và ghi chép học tập."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/me')}
              className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card hover:bg-muted"
            >
              ← Về trang cá nhân
            </button>
            <button
              onClick={handleOpenNew}
              className="tap px-3.5 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-medium rounded-sm border border-accent/40 shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm ghi chú</span>
            </button>
          </div>
        }
      />

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: `Tất cả (${notes.length})` },
          { id: 'note', label: 'Ghi chú (Note)' },
          { id: 'draft', label: 'Bản nháp (Draft)' },
          { id: 'document', label: 'Tài liệu (Document)' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`tap px-3 py-1.5 rounded-sm border text-xs font-mono font-medium transition-colors ${
              filterType === f.id
                ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Note Editor Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface max-w-xl w-full p-6 animate-rise space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-xl font-bold text-foreground">
                {editingNote === 'new' ? 'Tạo ghi chú mới' : 'Chỉnh sửa ghi chú'}
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1 rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Tiêu đề ghi chú *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Dàn ý thư xin lỗi cấp trên B1..."
                  className="w-full px-3 py-2 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-heading"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Phân loại
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                >
                  <option value="note">Ghi chú (Note)</option>
                  <option value="draft">Bản nháp (Draft)</option>
                  <option value="document">Tài liệu tham khảo (Document)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-foreground mb-1">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết nội dung ghi chú tại đây..."
                  className="w-full p-3 text-sm rounded-sm border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-heading leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="tap px-3 py-1.5 text-xs font-mono rounded-sm border border-border bg-card"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="tap px-5 py-1.5 bg-accent text-accent-foreground font-medium text-xs font-mono rounded-sm border border-accent/40 shadow-sm"
                >
                  Lưu ghi chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có ghi chú nào"
          description="Hãy tạo ghi chú đầu tiên để lưu lại từ vựng, mẹo làm đề hoặc bài luận mẫu."
          actionLabel="Tạo ghi chú mới"
          onAction={handleOpenNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="surface p-5 flex flex-col justify-between hover:border-accent/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-1.5">
                  <span className="uppercase tracking-wider px-1.5 py-0.2 rounded-sm bg-muted/60 border border-border">
                    {note.type}
                  </span>
                  <span>{new Date(note.created_at || Date.now()).toLocaleDateString('vi-VN')}</span>
                </div>

                <h3 className="font-display text-lg font-bold text-foreground">
                  {note.title}
                </h3>

                <p className="font-body text-xs text-muted-foreground mt-2 line-clamp-4 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 mt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(note)}
                  className="p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-mono inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-1.5 rounded-sm hover:bg-rose-50 dark:hover:bg-rose-950 text-muted-foreground hover:text-rose-600 text-xs font-mono inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
