import {elioAIAdmin} from '@/lib/elio-ai-admin-runtime';
// ====================================================================
// SPRACHMEISTERSCHAFT — FULL AI MODEL CATALOG MODAL
// Dynamic Model Catalog Explorer with Search, Category Filters & Free-Tier First
// ====================================================================

import React, { useState, useMemo,useEffect } from 'react';
import {
  X,
  Search,
  Sparkles,
  Zap,
  Camera,
  Mic,
  Brain,
  ShieldAlert,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';
import { filterAndSortCatalog, DEFAULT_AI_POLICY } from '@/lib/dynamic-model-discovery';
import { MODEL_TIERS } from '@/lib/ai-providers/adapters';
import { toast } from 'sonner';

export function ModelCatalogModal({
  isOpen,
  onClose,
  providerName = 'AI Provider',
  providerId = 'gemini',
  models = [],
  currentModelId = '',
  backupModelId = '',
  onSelectPrimary,
  onSelectBackup,
  lastSyncedAt = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('free'); // Default to Free Only
  const [sortBy, setSortBy] = useState('free_first');
  const [paidConfirmTarget, setPaidConfirmTarget] = useState(null); // { model, type: 'primary' | 'backup' }

  useEffect(()=>{if(isOpen&&elioAIAdmin()?.isActive())setActiveFilter(models.some(m=>m.pricing?.isFree)?'free':'all');},[isOpen,models]);

  const filteredModels = useMemo(() => {
    return filterAndSortCatalog(models, {
      searchQuery,
      filter: activeFilter,
      sortBy,
      policy: elioAIAdmin()?.isActive()?elioAIAdmin().api.getPolicies():DEFAULT_AI_POLICY,
    });
  }, [models, searchQuery, activeFilter, sortBy]);

  if (!isOpen) return null;

  const freeCount = models.filter((m) => m.pricing?.isFree).length;
  const totalCount = models.length;

  const handleChoose = async (model, type = 'primary') => {
    try{
    // If selecting a PAID model and policy requires confirmation
    if (!model.pricing?.isFree && model.pricing?.tier === MODEL_TIERS.PAID && (!elioAIAdmin()?.isActive()||elioAIAdmin().api.getPolicies().REQUIRE_ADMIN_APPROVAL_FOR_PAID)) {
      setPaidConfirmTarget({ model, type });
      return;
    }

    if (type === 'primary') {
      await onSelectPrimary(model.id, model);
      toast.success(`Đã chọn "${model.name || model.id}" làm Model chính!`);
    } else {
      await onSelectBackup(model.id, model);
      toast.success(`Đã chọn "${model.name || model.id}" làm Model dự phòng!`);
    }
    }catch(error){toast.error(error.message);}
  };

  const confirmPaidSelection = async () => {
    try{
    if (!paidConfirmTarget) return;
    const { model, type } = paidConfirmTarget;
    if (type === 'primary') {
      await onSelectPrimary(model.id, model);
      toast.warning(`Đã chọn model trả phí "${model.name || model.id}". Hãy theo dõi chi phí sử dụng!`);
    } else {
      await onSelectBackup(model.id, model);
      toast.warning(`Đã chọn model trả phí dự phòng "${model.name || model.id}".`);
    }
    setPaidConfirmTarget(null);
    }catch(error){toast.error(error.message);}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="surface max-w-4xl w-full max-h-[90vh] flex flex-col border border-border shadow-2xl animate-rise relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-3 shrink-0 bg-card">
          <div>
            <div className="eyebrow flex items-center gap-1.5 text-accent mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DANH MỤC MODEL TRỰC TIẾP TỪ API CHÍNH THỨC</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Toàn bộ Model: {providerName}
            </h2>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Khám phá thời gian thực ({totalCount} model phát hiện, {freeCount} model Free Tier).
              {lastSyncedAt && (
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                  • Cập nhật: {new Date(lastSyncedAt).toLocaleString('vi-VN')}
                </span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border/70 bg-muted/20 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo Model ID, tên gọi, tính năng (vd: flash, vision, r1, 70b)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-sm border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground shrink-0">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
              >
                <option value="free_first">⭐ Miễn phí (Free Tier) lên đầu</option>
                <option value="newest">🕒 Mới phát hiện</option>
                <option value="context">📚 Ngữ cảnh lớn nhất</option>
                <option value="name">🔤 Tên chữ cái (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            {[
              { id: 'free', label: `✨ Free Tier (${freeCount})`, icon: Zap },
              { id: 'all', label: `Tất cả (${totalCount})`, icon: Layers },
              { id: 'vision', label: '📷 Đọc ảnh / PDF', icon: Camera },
              { id: 'reasoning', label: '🧠 Suy luận chuyên sâu', icon: Brain },
              { id: 'audio', label: '🎙️ Giọng nói / Âm thanh', icon: Mic },
              { id: 'long_context', label: '📜 Ngữ cảnh lớn (>=64k)', icon: Sparkles },
            ].map((f) => {
              const Icon = f.icon;
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`tap px-2.5 py-1 rounded-sm border flex items-center gap-1.5 shrink-0 transition-colors ${
                    isActive
                      ? 'border-accent bg-accent text-accent-foreground font-bold'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Models List / Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredModels.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-sm bg-muted/10 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto opacity-70" />
              <div className="font-mono text-sm font-semibold text-foreground">
                Không tìm thấy model phù hợp
              </div>
              <p className="text-xs font-body text-muted-foreground">
                Thử xóa bớt từ khóa tìm kiếm hoặc chọn tab "Tất cả" để xem các model khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredModels.map((m) => {
                const isPrimary = currentModelId === m.id;
                const isBackup = backupModelId === m.id;
                const isFree = m.pricing?.isFree;

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-sm border text-left transition-all flex flex-col justify-between bg-card relative ${
                      isPrimary
                        ? 'border-accent ring-1 ring-accent bg-accent/5'
                        : isBackup
                        ? 'border-blue-500/60 bg-blue-500/5'
                        : 'border-border hover:border-accent/40 hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Name & Badges */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <h4 className="font-mono text-xs font-bold text-foreground truncate" title={m.name || m.id}>
                            {m.name || m.id}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                            <span className="truncate max-w-[200px]" title={m.id}>
                              {m.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(m.id);
                                toast.info(`Đã chép mã ID: ${m.id}`);
                              }}
                              className="text-muted-foreground hover:text-accent p-0.5"
                              title="Sao chép Model ID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Free / Paid Badge */}
                        <div className="shrink-0 flex items-center gap-1">
                          {isFree ? (
                            <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 text-[10px] font-mono font-bold border border-emerald-300 dark:border-emerald-800">
                              ✓ FREE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-sm bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 text-[10px] font-mono font-bold border border-amber-300 dark:border-amber-800">
                              {m.pricing?.tier==='UNKNOWN'?'TÙY TÀI KHOẢN':'PAID'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Capabilities Row */}
                      <div className="flex flex-wrap items-center gap-1.5 my-2">
                        {m.capabilities?.vision && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 text-[9px] font-mono font-medium flex items-center gap-1">
                            <Camera className="w-2.5 h-2.5" />
                            <span>Vision / Đọc ảnh</span>
                          </span>
                        )}
                        {m.capabilities?.reasoning && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 text-[9px] font-mono font-medium flex items-center gap-1">
                            <Brain className="w-2.5 h-2.5" />
                            <span>Reasoning / Suy luận</span>
                          </span>
                        )}
                        {m.capabilities?.audio && (
                          <span className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-[9px] font-mono font-medium flex items-center gap-1">
                            <Mic className="w-2.5 h-2.5" />
                            <span>Audio</span>
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] font-mono">
                          {m.contextWindow || '32k tokens'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-[11px] font-body text-muted-foreground line-clamp-2 mt-1">
                        {m.desc || 'Không có mô tả chi tiết từ nhà cung cấp.'}
                      </p>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-2.5 mt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="text-[10px] font-mono text-muted-foreground truncate">
                        {m.pricing?.note || (isFree ? 'Miễn phí' : 'Model có phí')}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleChoose(m, 'backup')}
                          disabled={isBackup}
                          className={`tap px-2 py-1 rounded-sm text-[10px] font-mono font-medium border transition-colors ${
                            isBackup
                              ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 font-bold'
                              : 'bg-muted/40 border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isBackup ? '✓ Đang làm Dự phòng' : 'Gán Dự phòng'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleChoose(m, 'primary')}
                          disabled={isPrimary}
                          className={`tap px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold transition-all shadow-sm ${
                            isPrimary
                              ? 'bg-accent text-accent-foreground cursor-default'
                              : 'bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          {isPrimary ? '★ Đang dùng Chính' : 'Chọn làm Model Chính'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
            <span>Model chính hiện tại:</span>
            <span className="font-bold text-accent">{currentModelId || 'Chưa chọn'}</span>
            {backupModelId && (
              <>
                <span>| Dự phòng:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{backupModelId}</span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="tap px-4 py-1.5 rounded-sm bg-muted hover:bg-muted/80 text-foreground text-xs font-mono font-semibold"
          >
            Đóng cửa sổ
          </button>
        </div>

        {/* Confirmation Modal for Paid Model Selection */}
        {paidConfirmTarget && (
          <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
            <div className="surface max-w-md w-full p-6 border-2 border-amber-500/50 space-y-4 animate-rise shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <div className="eyebrow text-amber-600">CẢNH BÁO MODEL CÓ PHÍ (PAID TIER)</div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Xác nhận chọn Model trả phí?
                </h3>
                <p className="text-xs font-body text-muted-foreground">
                  Model <strong>{paidConfirmTarget.model.name || paidConfirmTarget.model.id}</strong> là mô hình thương mại có tính phí sử dụng.
                </p>
                <div className="p-2.5 rounded bg-muted text-[11px] font-mono text-foreground text-left mt-2">
                  Chi phí ước tính: {paidConfirmTarget.model.pricing?.note || 'Tính phí theo token gọi API.'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setPaidConfirmTarget(null)}
                  className="tap px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground rounded"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmPaidSelection}
                  className="tap px-4 py-1.5 text-xs font-mono font-bold bg-amber-600 hover:bg-amber-700 text-white rounded shadow-sm"
                >
                  Tôi hiểu, tiếp tục chọn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default ModelCatalogModal;
