import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import {
  AI_PROVIDERS,
  FREE_AI_MODELS,
  APP_AI_TASKS,
} from '@/data/ai-models-catalog';
import {
  Bot,
  Layers,
  Users,
  Palette,
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Volume2,
  Sparkles,
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Mic,
  Zap,
  Globe,
  Lock,
  Eye,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminPage() {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'content' | 'users' | 'ui'

  // Master Admin verification
  const currentUser = db.auth.getUser();
  const [isAdmin, setIsAdmin] = useState(() => db.auth.isAdmin());

  // AI State
  const [aiConfigs, setAiConfigs] = useState(() => db.aiConfig.getConfigs());
  const [aiAssignments, setAiAssignments] = useState(() => db.aiConfig.getAssignments());

  // Form New AI
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [apiKey, setApiKey] = useState('');
  const [priority, setPriority] = useState(1);
  const [hasVision, setHasVision] = useState(true);

  // Content State
  const [universalItems, setUniversalItems] = useState(() => db.universal.findMany());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState(() => db.users.findAll());
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');

  // UI & Voice State
  const [uiVoice, setUiVoice] = useState(() => db.uiVoiceConfig.get());
  const [availableVoices, setAvailableVoices] = useState([]);

  useEffect(() => {
    // Load German speech voices from browser
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const deVoices = voices.filter((v) => v.lang.startsWith('de'));
        setAvailableVoices(deVoices.length > 0 ? deVoices : voices.slice(0, 8));
      }
    };
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Filter models for selected provider
  const availableModelsForProvider = FREE_AI_MODELS.filter(
    (m) => m.provider === providerType
  );

  const handleSelectSuggestedModel = (model) => {
    setSelectedModel(model.id);
    setHasVision(model.hasVision);
    if (!providerName) {
      setProviderName(`${model.name}`);
    }
  };

  const handleAddAIConfig = (e) => {
    e.preventDefault();
    if (!selectedModel) {
      toast.error('Vui lòng chọn model AI!');
      return;
    }
    const newConfig = {
      id: `ai-cfg-${Date.now()}`,
      name: providerName || `${providerType.toUpperCase()} - ${selectedModel}`,
      provider: providerType,
      model: selectedModel,
      apiKey: apiKey.trim(),
      hasVision,
      priority: Number(priority) || 1,
      enabled: true,
    };
    db.aiConfig.saveConfig(newConfig);
    setAiConfigs(db.aiConfig.getConfigs());
    setProviderName('');
    setApiKey('');
    toast.success(`Đã thêm cấu hình AI: ${newConfig.name}!`);
  };

  const handleDeleteAIConfig = (id) => {
    db.aiConfig.deleteConfig(id);
    setAiConfigs(db.aiConfig.getConfigs());
    toast.success('Đã xóa cấu hình AI!');
  };

  const handleAssignTask = (taskId, provId, modelId) => {
    db.aiConfig.setAssignment(taskId, provId, modelId);
    setAiAssignments(db.aiConfig.getAssignments());
    toast.success('Đã cập nhật phân công AI cho tác vụ!');
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;
    const u = db.users.create({
      name: newUserName.trim() || newUserEmail.split('@')[0],
      email: newUserEmail.trim(),
      role: newUserRole,
    });
    setUsersList(db.users.findAll());
    setNewUserName('');
    setNewUserEmail('');
    toast.success(`Đã tạo tài khoản cho: ${u.email}!`);
  };

  const handleToggleBlockUser = (id) => {
    db.users.toggleBlock(id);
    setUsersList(db.users.findAll());
    toast.success('Đã thay đổi trạng thái chặn tài khoản!');
  };

  const handleToggleRoleUser = (id) => {
    db.users.toggleRole(id);
    setUsersList(db.users.findAll());
    toast.success('Đã cập nhật vai trò người dùng!');
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa tài khoản này khỏi hệ thống không?')) {
      db.users.delete(id);
      setUsersList(db.users.findAll());
      toast.success('Đã xóa tài khoản!');
    }
  };

  const handleSaveUIVoice = (updates) => {
    const updated = db.uiVoiceConfig.update(updates);
    setUiVoice(updated);
    toast.success('Đã cập nhật tùy chỉnh giao diện và giọng đọc!');
  };

  const handleTestSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Guten Tag! Ich bin Elio, Ihr persönlicher KI-Sprachlehrer.');
      utterance.lang = 'de-DE';
      if (uiVoice.speechVoice) {
        const found = availableVoices.find((v) => v.name === uiVoice.speechVoice);
        if (found) utterance.voice = found;
      }
      utterance.rate = uiVoice.rate || 0.9;
      utterance.pitch = uiVoice.pitch || 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="space-y-6 animate-rise max-w-7xl mx-auto pb-12">
      <PageHeader
        eyebrow="TRUNG TÂM KIỂM SOÁT HỆ THỐNG"
        title="Quản trị Sprachmeisterschaft"
        deTitle="Administrationsbereich"
        subtitle="Quản lý toàn diện: phân công mô hình AI, kho học thuật theo cấp độ, kiểm soát tài khoản học viên và tùy biến giao diện."
        actions={
          <div className="flex items-center gap-2">
            {!isAdmin ? (
              <button
                onClick={() => {
                  db.auth.setRole('admin');
                  setIsAdmin(true);
                  toast.success('Đã chuyển sang vai trò Master Admin toàn quyền!');
                }}
                className="tap px-3 py-1.5 rounded-sm bg-accent text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bật quyền Master Admin</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-mono text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Master Admin Active</span>
              </span>
            )}
          </div>
        }
      />

      {/* 4 Tabs Navigation (Matching Image 3) */}
      <div className="flex items-center gap-1 border-b border-border pb-1 overflow-x-auto">
        {[
          { id: 'ai', label: 'AI & phân công', icon: Bot },
          { id: 'content', label: 'Nội dung học', icon: Layers },
          { id: 'users', label: 'Tài khoản & quyền', icon: Users },
          { id: 'ui', label: 'Giao diện & giọng đọc', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tap px-4 py-2 rounded-t-sm text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition-all shrink-0 ${
                isActive
                  ? 'border-accent text-accent bg-accent/5 font-bold shadow-sm'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI & PHÂN CÔNG (Matching Image 2 & 3) */}
      {/* ========================================================================= */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-fade-in">
          {/* Section 1: API AI · Ưu tiên & dự phòng */}
          <div className="surface p-6 border border-border space-y-5">
            <div>
              <div className="eyebrow mb-1">CẤU HÌNH NHÀ CUNG CẤP</div>
              <h3 className="font-display text-xl font-bold text-foreground">
                API AI · Ưu tiên & dự phòng
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Key được mã hóa bảo mật. Quota có thể dùng chung theo dự án nhà cung cấp. Hỗ trợ dự phòng thông minh khi hết lượt gọi.
              </p>
            </div>

            {/* Add new AI config form */}
            <form
              onSubmit={handleAddAIConfig}
              autoComplete="off"
              className="p-4 rounded-sm bg-muted/20 border border-border space-y-4"
            >
              <div className="font-mono text-xs font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" />
                <span>+ Thêm cấu hình API AI</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    Tên gợi nhớ
                  </label>
                  <input
                    type="text"
                    name="elio_custom_ai_alias"
                    autoComplete="off"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="Ví dụ: Gemini 2.0 Flash Đọc Ảnh"
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    Nhà cung cấp *
                  </label>
                  <select
                    name="elio_ai_provider_select"
                    value={providerType}
                    onChange={(e) => {
                      const p = e.target.value;
                      setProviderType(p);
                      const def = FREE_AI_MODELS.find((m) => m.provider === p);
                      if (def) {
                        setSelectedModel(def.id);
                        setHasVision(def.hasVision);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono font-bold"
                  >
                    {AI_PROVIDERS.map((pr) => (
                      <option key={pr.id} value={pr.id}>
                        {pr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    Model chỉ định *
                  </label>
                  <select
                    name="elio_ai_model_select"
                    value={selectedModel}
                    onChange={(e) => {
                      const mId = e.target.value;
                      setSelectedModel(mId);
                      const m = FREE_AI_MODELS.find((x) => x.id === mId);
                      if (m) setHasVision(m.hasVision);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono font-bold text-accent"
                  >
                    {availableModelsForProvider.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) {m.hasVision ? '📷 Đọc ảnh' : '⚡ Tốc độ'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Model Suggestions Grid (Matching Image 2) */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Gợi ý đã tra cứu mới nhất 2026 · Bấm để điền model và khả năng ảnh:</span>
                  <span className="text-accent text-[10px]">Free Tier Verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {availableModelsForProvider.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectSuggestedModel(m)}
                        className={`tap p-2.5 rounded-sm border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-accent bg-accent/10 ring-1 ring-accent'
                            : 'border-border bg-card hover:bg-muted/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs font-bold text-foreground truncate">
                              {m.name}
                            </span>
                            {m.hasVision && (
                              <span className="px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 text-[9px] font-mono font-bold">
                                📷 Ảnh/PDF
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-accent truncate">
                            {m.alias || m.id}
                          </div>
                          <p className="text-[11px] font-body text-muted-foreground line-clamp-2 mt-1">
                            {m.desc}
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-border/80 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                          <span>{m.speed}</span>
                          <span className="text-accent font-semibold">{m.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* API Key & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                <div className="sm:col-span-8">
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    API Key ({providerType.toUpperCase()})
                  </label>
                  <input
                    type="password"
                    name="elio_custom_ai_secret_key"
                    autoComplete="new-password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Dán mã key ${providerType.toUpperCase()} của bạn...`}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    Mức ưu tiên gọi (1 = cao nhất)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-foreground">
                  <input
                    type="checkbox"
                    checked={hasVision}
                    onChange={(e) => setHasVision(e.target.checked)}
                    className="rounded-sm border-border text-accent focus:ring-accent"
                  />
                  <span>Hỗ trợ đọc ảnh (Gemini / OpenRouter, PDF gồm cả Groq/Gemini)</span>
                </label>

                <button
                  type="submit"
                  className="tap px-4 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm API</span>
                </button>
              </div>
            </form>

            {/* Configured AI List */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono font-bold text-foreground">
                Danh sách API AI đang hoạt động ({aiConfigs.length}):
              </div>
              <div className="grid grid-cols-1 gap-2">
                {aiConfigs.map((cfg) => (
                  <div
                    key={cfg.id}
                    className="p-3 rounded-sm border border-border bg-card flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <span className="font-bold text-foreground mr-2">{cfg.name}</span>
                        <span className="px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent font-bold text-[10px]">
                          {cfg.provider.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground ml-2">({cfg.model})</span>
                        {cfg.hasVision && (
                          <span className="ml-2 text-[10px] text-blue-600 font-bold">
                            📷 Có Vision
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-[11px]">
                        Ưu tiên: #{cfg.priority}
                      </span>
                      <button
                        onClick={() => handleDeleteAIConfig(cfg.id)}
                        className="text-rose-600 hover:text-rose-700 p-1 rounded-sm hover:bg-muted"
                        title="Xóa cấu hình này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Phân công chi tiết & hỗ trợ tự động (Matching Image 3) */}
          <div className="surface p-6 border border-border space-y-4">
            <div>
              <div className="eyebrow mb-1">RÀ SOÁT TÁC VỤ ỨNG DỤNG</div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Phân công chi tiết & hỗ trợ tự động
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Bảng phân công chính xác model AI phù hợp nhất cho từng công việc cụ thể trong ứng dụng.
              </p>
            </div>

            <div className="space-y-3">
              {APP_AI_TASKS.map((task) => {
                const assigned = aiAssignments[task.id] || {
                  provider: task.needsVision ? 'gemini' : 'groq',
                  model: task.defaultRecommendation,
                };

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-sm border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {task.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded-sm bg-muted text-[10px] font-mono text-muted-foreground">
                          {task.category}
                        </span>
                        {task.needsVision && (
                          <span className="px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 text-[10px] font-mono font-bold flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>Yêu cầu Vision</span>
                          </span>
                        )}
                      </div>
                      <p className="font-body text-xs text-muted-foreground leading-relaxed">
                        {task.desc}
                      </p>
                    </div>

                    {/* Assigned Model Selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={assigned.model}
                        onChange={(e) => {
                          const mId = e.target.value;
                          const m = FREE_AI_MODELS.find((x) => x.id === mId);
                          handleAssignTask(task.id, m?.provider || 'gemini', mId);
                        }}
                        className="px-3 py-1.5 rounded-sm border border-border bg-background text-foreground font-mono text-xs font-bold text-accent"
                      >
                        {FREE_AI_MODELS.filter((m) => !task.needsVision || m.hasVision).map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.provider.toUpperCase()} · {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NỘI DUNG HỌC & IMPORT TRUNG TÂM */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="surface p-6 border border-border space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="eyebrow mb-1">KHO TRI THỨC TOÀN HỆ THỐNG</div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Quản lý kho học thuật & Phân phối nội dung
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Kiểm soát hiển thị: Công khai toàn app (Public), Nội bộ Admin (Admin Only), hoặc Cá nhân (Private).
              </p>
            </div>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="tap px-4 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Import nội dung mới</span>
            </button>
          </div>

          {/* Universal Imports Table */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold text-foreground">
              Các gói nội dung đã nhập vào hệ thống ({universalItems.length}):
            </div>

            {universalItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Loại</th>
                      <th className="p-3">Tiêu đề</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Quyền phân phối (Scope)</th>
                      <th className="p-3">Người tạo</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {universalItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="p-3 uppercase font-bold text-accent">{item.type}</td>
                        <td className="p-3 font-semibold text-foreground">{item.title}</td>
                        <td className="p-3 font-bold">{item.level}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                              item.scope === 'public'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                : item.scope === 'admin_only'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
                            }`}
                          >
                            {item.scope === 'public'
                              ? '🌐 Toàn hệ thống'
                              : item.scope === 'admin_only'
                              ? '🔒 Nội bộ Admin'
                              : '👤 Cá nhân'}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{item.created_by_name}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              db.universal.delete(item.id);
                              setUniversalItems(db.universal.findMany());
                              toast.success('Đã xóa gói nội dung!');
                            }}
                            className="tap text-rose-600 hover:text-rose-700 p-1 hover:bg-muted rounded-sm"
                            title="Xóa gói này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-mono text-muted-foreground border border-dashed border-border rounded-sm">
                Chưa có gói import nào. Hãy bấm nút "Import nội dung mới" ở góc trên để bắt đầu!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TÀI KHOẢN & QUYỀN (Admin Controls) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="surface p-6 border border-border space-y-6 animate-fade-in">
          <div>
            <div className="eyebrow mb-1">QUẢN TRỊ TÀI KHOẢN ĐĂNG NHẬP</div>
            <h3 className="font-display text-2xl font-bold text-foreground">
              Kiểm soát & Phân quyền học viên
            </h3>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Toàn quyền: Chặn đăng nhập (Block/Ban), mở khóa, xóa tài khoản và phân quyền Admin tối cao.
            </p>
          </div>

          {/* Add User Form */}
          <form onSubmit={handleAddUser} className="p-4 rounded-sm bg-muted/20 border border-border space-y-3">
            <div className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-accent" />
              <span>Thêm tài khoản người dùng mới</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Họ và tên..."
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
              />
              <input
                type="email"
                required
                placeholder="Địa chỉ email..."
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
              />
              <div className="flex items-center gap-2">
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono font-bold"
                >
                  <option value="user">Học viên (User)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
                <button
                  type="submit"
                  className="tap px-4 py-2 rounded-sm bg-accent text-accent-foreground font-mono text-xs font-semibold shrink-0"
                >
                  Tạo
                </button>
              </div>
            </div>
          </form>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">Học viên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3 text-right">Quyền hạn thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="p-3 font-semibold text-foreground flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">
                        {u.name?.[0] || 'U'}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleRoleUser(u.id)}
                        className={`tap px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                          u.role === 'admin'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-300'
                            : 'bg-muted text-foreground border border-border'
                        }`}
                        title="Bấm để chuyển đổi vai trò Admin / User"
                      >
                        {u.role === 'admin' ? '🛡️ MASTER ADMIN' : '👤 HỌC VIÊN'}
                      </button>
                    </td>
                    <td className="p-3">
                      {u.is_blocked ? (
                        <span className="px-2 py-0.5 rounded-sm bg-rose-600 text-white font-bold text-[10px]">
                          ĐÃ BỊ CHẶN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 text-[10px] font-bold">
                          HOẠT ĐỘNG
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleBlockUser(u.id)}
                          className={`tap p-1.5 rounded-sm text-xs ${
                            u.is_blocked
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={u.is_blocked ? 'Mở khóa tài khoản' : 'Chặn đăng nhập'}
                        >
                          {u.is_blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="tap p-1.5 rounded-sm text-rose-600 hover:bg-rose-50"
                          title="Xóa vĩnh viễn tài khoản"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GIAO DIỆN & GIỌNG ĐỌC */}
      {/* ========================================================================= */}
      {activeTab === 'ui' && (
        <div className="surface p-6 border border-border space-y-6 animate-fade-in">
          <div>
            <div className="eyebrow mb-1">TÙY BIẾN HỆ THỐNG</div>
            <h3 className="font-display text-2xl font-bold text-foreground">
              Giao diện kiểu chữ & Giọng nói tiếng Đức
            </h3>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              Cá nhân hóa phông chữ ấn phẩm và cấu hình giọng đọc chuẩn bản ngữ Đức (Web Speech API).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Typography selection */}
            <div className="p-4 rounded-sm border border-border bg-card space-y-3">
              <div className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-accent" />
                <span>Kiểu phông chữ hiển thị toàn app</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'serif', label: 'Ấn phẩm Đức cổ điển (Cormorant Garamond + Lora)', desc: 'Phong cách trang báo hàn lâm, trang nghiêm, ấm áp.' },
                  { id: 'sans', label: 'Hiện đại & Trực quan (Inter + Outfit Sans)', desc: 'Gọn gàng, dễ nhìn, phù hợp màn hình nhỏ.' },
                  { id: 'mono', label: 'Học thuật Kỹ thuật (JetBrains Mono)', desc: 'Phù hợp người thích số liệu, thẻ từ sắc nét.' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSaveUIVoice({ fontFamily: f.id })}
                    className={`tap w-full p-3 rounded-sm border text-left transition-all ${
                      uiVoice.fontFamily === f.id
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="font-display font-bold text-sm text-foreground">
                      {f.label}
                    </div>
                    <div className="text-xs font-body text-muted-foreground mt-0.5">
                      {f.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speech voice selection */}
            <div className="p-4 rounded-sm border border-border bg-card space-y-3">
              <div className="font-mono text-xs font-bold text-foreground flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-accent" />
                <span>Giọng đọc phát âm tiếng Đức (de-DE)</span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                  Chọn giọng đọc phát âm cài đặt trên máy:
                </label>
                <select
                  value={uiVoice.speechVoice}
                  onChange={(e) => handleSaveUIVoice({ speechVoice: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-background text-foreground font-mono"
                >
                  <option value="">-- Mặc định hệ điều hành (Deutsch Standard) --</option>
                  {availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate & Pitch sliders */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Tốc độ đọc: {uiVoice.rate || 0.9}x</span>
                  <span className="text-muted-foreground">0.7x (Chậm) - 1.3x (Nhanh)</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={uiVoice.rate || 0.9}
                  onChange={(e) => handleSaveUIVoice({ rate: Number(e.target.value) })}
                  className="w-full accent-accent"
                />

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleTestSpeech}
                    className="tap w-full py-2 px-3 rounded-sm bg-accent/10 border border-accent/30 text-accent font-mono text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Thử nghe giọng đọc mẫu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultType="vocabulary"
        onSuccess={() => {
          setUniversalItems(db.universal.findMany());
        }}
      />
    </div>
  );
}
export default AdminPage;
