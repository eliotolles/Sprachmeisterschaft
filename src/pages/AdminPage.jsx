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
import { testAiConnection, testAiTaskSpecific } from '@/lib/ai-evaluator';
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
  Edit3,
  RotateCcw,
  Check,
  X,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { getAllExams } from '@/data/all-exams';
import { GRAMMAR_CORE } from '@/data/grammar';
import { GRAMMAR_EXTRA } from '@/data/grammar-extra';
import { SITUATIONS } from '@/data/situations';
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
  const [customModelInput, setCustomModelInput] = useState('');
  const [isCustomModelMode, setIsCustomModelMode] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [priority, setPriority] = useState(1);
  const [hasVision, setHasVision] = useState(true);
  const [testingAi, setTestingAi] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [taskPoolResults, setTaskPoolResults] = useState({});

  // Content State
  const [universalItems, setUniversalItems] = useState(() => db.universal.findMany());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [contentSubTab, setContentSubTab] = useState('universal');
  const [examsList, setExamsList] = useState(() => getAllExams());
  const [grammarDeletedIds, setGrammarDeletedIds] = useState(() => db.grammar?.getDeletedIds?.() || []);
  const [grammarOverrides, setGrammarOverrides] = useState(() => db.grammar?.getOverrides?.() || {});
  const [situationDeletedIds, setSituationDeletedIds] = useState(() => db.situations?.getDeletedIds?.() || []);
  const [situationOverrides, setSituationOverrides] = useState(() => db.situations?.getOverrides?.() || {});
  const [listeningCols, setListeningCols] = useState(() => db.listening.getCollections());
  const [vocabCards, setVocabCards] = useState(() => db.vocabulary.findMany());
  const [adminEditingItem, setAdminEditingItem] = useState(null); // { type, data }

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

    const handleDbChange = () => {
      setUniversalItems(db.universal.findMany());
      setExamsList(getAllExams());
      setGrammarDeletedIds(db.grammar?.getDeletedIds?.() || []);
      setGrammarOverrides(db.grammar?.getOverrides?.() || {});
      setSituationDeletedIds(db.situations?.getDeletedIds?.() || []);
      setSituationOverrides(db.situations?.getOverrides?.() || {});
      setListeningCols(db.listening.getCollections());
      setVocabCards(db.vocabulary.findMany());
      setUsersList(db.users.findAll());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, []);

  const computedGrammarList = [...GRAMMAR_CORE, ...GRAMMAR_EXTRA]
    .filter((g) => !grammarDeletedIds.includes(g.id))
    .map((g) => (grammarOverrides[g.id] ? { ...g, ...grammarOverrides[g.id] } : g));

  const computedSituationsList = SITUATIONS
    .filter((s) => !situationDeletedIds.includes(s.id))
    .map((s) => (situationOverrides[s.id] ? { ...s, ...situationOverrides[s.id] } : s));

  // Filter models for selected provider
  const availableModelsForProvider = FREE_AI_MODELS.filter(
    (m) => m.provider === providerType
  );

  const handleSelectSuggestedModel = (model) => {
    setSelectedModel(model.id);
    setIsCustomModelMode(false);
    setHasVision(model.hasVision);
    if (!providerName) {
      setProviderName(`${model.name}`);
    }
  };

  const handleTestDraftConfig = async () => {
    const finalModel = isCustomModelMode ? customModelInput.trim() : selectedModel;
    if (!finalModel) {
      toast.error('Vui lòng chọn hoặc điền mã Model trước khi kiểm tra!');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('Vui lòng nhập API Key trước khi kiểm tra kết nối!');
      return;
    }

    setTestingAi(true);
    toast.info(`Đang gửi tín hiệu kiểm tra tới ${providerType.toUpperCase()}...`);
    const res = await testAiConnection({
      provider: providerType,
      model: finalModel,
      apiKey: apiKey.trim(),
      baseUrl: customBaseUrl.trim(),
    });

    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setTestingAi(false);
  };

  const handleTestActiveConfig = async (cfg) => {
    toast.info(`Đang kiểm tra API ${cfg.name}...`);
    const res = await testAiConnection(cfg);
    setTestResults((prev) => ({
      ...prev,
      [cfg.id]: res,
    }));
    if (res.success) {
      toast.success(`[${cfg.name}]: ${res.message}`);
    } else {
      toast.error(`[${cfg.name}]: ${res.message}`);
    }
  };

  const handleAddAIConfig = (e) => {
    e.preventDefault();
    const finalModel = isCustomModelMode ? customModelInput.trim() : selectedModel;
    if (!finalModel) {
      toast.error('Vui lòng chọn hoặc điền mã model AI!');
      return;
    }
    if (finalModel.includes('@')) {
      toast.error('Mã model không hợp lệ! Vui lòng không nhập địa chỉ email vào ô Model.');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('Vui lòng dán mã API Key!');
      return;
    }
    const newConfig = {
      id: `ai-cfg-${Date.now()}`,
      name: providerName || `${providerType.toUpperCase()} - ${finalModel}`,
      provider: providerType,
      model: finalModel,
      apiKey: apiKey.trim(),
      baseUrl: providerType === 'custom' ? customBaseUrl.trim() : undefined,
      hasVision,
      priority: Number(priority) || 1,
      enabled: true,
    };
    db.aiConfig.saveConfig(newConfig);
    setAiConfigs(db.aiConfig.getConfigs());
    setProviderName('');
    setApiKey('');
    setCustomModelInput('');
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

  const handleAddToTaskPool = async (taskId, configId) => {
    if (!configId) return;
    const task = APP_AI_TASKS.find((t) => t.id === taskId);
    const config = aiConfigs.find((c) => c.id === configId);
    if (!task || !config) return;

    if (task.needsVision && !config.hasVision) {
      toast.error(`Tác vụ "${task.name}" bắt buộc model hỗ trợ đọc ảnh (Vision).`);
      return;
    }

    db.aiConfig.addToTaskPool(taskId, configId);
    setAiConfigs([...db.aiConfig.getConfigs()]);
    toast.success(`Đã thêm Key "${config.name}" vào nhóm tác vụ "${task.name}"!`);
    handleTestTaskKey(taskId, configId);
  };

  const handleRemoveFromTaskPool = (taskId, configId) => {
    db.aiConfig.removeFromTaskPool(taskId, configId);
    setAiConfigs([...db.aiConfig.getConfigs()]);
    toast.info('Đã gỡ Key khỏi nhóm tác vụ.');
  };

  const handleTestTaskKey = async (taskId, configId) => {
    const task = APP_AI_TASKS.find((t) => t.id === taskId);
    const config = aiConfigs.find((c) => c.id === configId);
    if (!task || !config) return;

    const testKey = `${taskId}_${configId}`;
    setTestingAi(true);
    setTaskPoolResults((prev) => ({ ...prev, [testKey]: { loading: true } }));

    try {
      const res = await testAiTaskSpecific(config, task);
      setTaskPoolResults((prev) => ({
        ...prev,
        [testKey]: { loading: false, success: res.success, message: res.message },
      }));
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      setTaskPoolResults((prev) => ({
        ...prev,
        [testKey]: { loading: false, success: false, message: err.message },
      }));
      toast.error(`Thất bại: ${err.message}`);
    } finally {
      setTestingAi(false);
    }
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-foreground">
                      Model chỉ định *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomModelMode(!isCustomModelMode)}
                      className="text-[10px] font-mono text-accent hover:underline font-bold"
                    >
                      {isCustomModelMode ? '← Chọn từ danh mục' : '+ Tự gõ Model khác'}
                    </button>
                  </div>

                  {isCustomModelMode ? (
                    <input
                      type="text"
                      name="elio_custom_model_input_text"
                      id="elio_custom_model_input_text"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      value={customModelInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes('@')) {
                          toast.warning('Ô này chỉ để nhập mã Model AI (như gemini-2.0-flash), không phải địa chỉ email!');
                          return;
                        }
                        setCustomModelInput(val);
                      }}
                      placeholder="Gõ mã model (vd: gemini-2.0-flash, llama-3.3-70b-versatile...)"
                      className="w-full px-3 py-2 text-xs rounded-sm border border-accent bg-card text-accent font-mono font-bold"
                    />
                  ) : (
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
                  )}
                </div>
              </div>

              {providerType === 'custom' && (
                <div className="pt-1">
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    Base URL (OpenAI-compatible Endpoint) *
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="Ví dụ: http://localhost:11434/v1 hoặc https://api.my-gateway.com/v1"
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  />
                </div>
              )}

              {/* Model Suggestions Grid (Matching Image 2) */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Gợi ý model thế hệ mới 2025/2026 · Bấm để điền model và khả năng ảnh:</span>
                  <span className="text-accent text-[10px]">Verified Modern Models</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {availableModelsForProvider.map((m) => {
                    const isSelected = selectedModel === m.id && !isCustomModelMode;
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
                          <div className="flex items-center justify-between mb-1 gap-1">
                            <span className="font-mono text-xs font-bold text-foreground truncate">
                              {m.name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {m.isNew && (
                                <span className="px-1 py-0.2 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-mono font-bold">
                                  MỚI
                                </span>
                              )}
                              {m.hasVision && (
                                <span className="px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 text-[9px] font-mono font-bold">
                                  📷 Ảnh/PDF
                                </span>
                              )}
                            </div>
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
                  <span>Hỗ trợ đọc ảnh (Gemini / Claude / GPT-4o / Groq Vision / OpenRouter)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={testingAi}
                    onClick={handleTestDraftConfig}
                    className="tap px-3.5 py-2 rounded-sm border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-mono font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{testingAi ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Test Key)'}</span>
                  </button>

                  <button
                    type="submit"
                    className="tap px-4 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm API</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Configured AI List */}
            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono font-bold text-foreground">
                Danh sách API AI đang hoạt động ({aiConfigs.length}):
              </div>
              <div className="grid grid-cols-1 gap-2">
                {aiConfigs.map((cfg) => {
                  const testRes = testResults[cfg.id];
                  return (
                    <div
                      key={cfg.id}
                      className="p-3 rounded-sm border border-border bg-card flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            testRes
                              ? testRes.success
                                ? 'bg-emerald-500 ring-2 ring-emerald-300'
                                : 'bg-rose-500 ring-2 ring-rose-300'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{cfg.name}</span>
                            <span className="px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent font-bold text-[10px]">
                              {cfg.provider.toUpperCase()}
                            </span>
                            <span className="text-accent font-semibold">({cfg.model})</span>
                            {cfg.hasVision && (
                              <span className="text-[10px] text-blue-600 font-bold">
                                📷 Vision
                              </span>
                            )}
                          </div>
                          {testRes && (
                            <div
                              className={`text-[10px] mt-0.5 ${
                                testRes.success ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {testRes.message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-[11px] mr-1">
                          Ưu tiên: #{cfg.priority}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleTestActiveConfig(cfg)}
                          className="tap px-2 py-1 rounded bg-muted/50 hover:bg-muted text-accent font-semibold text-[11px] flex items-center gap-1 border border-border"
                          title="Kiểm tra tín hiệu kết nối tới model này"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Test Live</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAIConfig(cfg.id)}
                          className="text-rose-600 hover:text-rose-700 p-1.5 rounded-sm hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Xóa cấu hình này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Phân công chi tiết & hỗ trợ tự động (Matching Image 3) */}
          <div className="surface p-6 border border-border space-y-4">
            <div>
              <div className="eyebrow mb-1">RÀ SOÁT TÁC VỤ ỨNG DỤNG</div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Phân công theo Nhóm Tác vụ & Danh sách Key Dự phòng
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Mỗi công việc có danh sách các Key riêng (Ưu tiên #1, #2, #3). Tự chuyển key khác cùng nhóm khi 429/Timeout, không gọi nhầm nhóm khác.
              </p>
            </div>

            <div className="space-y-4">
              {APP_AI_TASKS.map((task) => {
                const pooledConfigs = db.aiConfig?.getTaskPool?.(task.id) || [];
                const eligibleToAdd = aiConfigs.filter((cfg) => {
                  const notInPool = !pooledConfigs.some((p) => p.id === cfg.id);
                  if (task.needsVision && !cfg.hasVision) return false;
                  return notInPool;
                });

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-sm border border-border bg-card space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-2.5">
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
                              <span>Bắt buộc Vision</span>
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-muted-foreground leading-relaxed">
                          {task.desc}
                        </p>
                      </div>

                      {/* Dropdown to add Key to this task */}
                      {eligibleToAdd.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddToTaskPool(task.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-sm border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent font-mono text-xs font-bold cursor-pointer"
                          >
                            <option value="">+ Gán thêm Key vào nhóm này...</option>
                            {eligibleToAdd.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.provider.toUpperCase()} · {c.model})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Assigned Keys List in Priority Order */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono font-bold text-muted-foreground flex flex-wrap items-center justify-between gap-1">
                        <span>Danh sách Key trong nhóm này ({pooledConfigs.length} Key):</span>
                        <span className="text-[10px] font-normal italic">
                          Tự chuyển Key dự phòng khi gặp 429/Timeout • Cooldown 30s
                        </span>
                      </div>

                      {pooledConfigs.length === 0 ? (
                        <div className="p-3 rounded-sm border border-dashed border-border bg-muted/20 text-xs font-mono text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <span>Chưa có Key nào gán riêng. Tác vụ này sẽ dùng danh sách API tổng thể theo thứ tự ưu tiên.</span>
                          {eligibleToAdd.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAddToTaskPool(task.id, eligibleToAdd[0].id)}
                              className="text-accent underline font-bold text-xs"
                            >
                              Gán {eligibleToAdd[0].name} ngay
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {pooledConfigs.map((cfg, cIdx) => {
                            const testKey = `${task.id}_${cfg.id}`;
                            const testRes = taskPoolResults[testKey];
                            const cooldown = db.aiConfig?.getKeyCooldown?.(cfg.id);
                            const inCooldown = cooldown && cooldown.until > Date.now();
                            const cooldownSec = inCooldown ? Math.ceil((cooldown.until - Date.now()) / 1000) : 0;

                            return (
                              <div
                                key={cfg.id}
                                className="p-2.5 rounded-sm border border-border bg-background flex flex-col gap-2 text-xs font-mono"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold text-[10px]">
                                      #{cIdx + 1} {cIdx === 0 ? 'Chính' : `Dự phòng ${cIdx}`}
                                    </span>
                                    <span className="font-bold text-foreground">{cfg.name}</span>
                                    <span className="text-muted-foreground text-[11px]">
                                      ({cfg.provider.toUpperCase()} · {cfg.model})
                                    </span>
                                    {cfg.hasVision && (
                                      <span className="text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                                        Vision
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {inCooldown ? (
                                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 text-[10px] font-bold">
                                        ⏸️ Cooldown 429 ({cooldownSec}s)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span>Sẵn sàng</span>
                                      </span>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleTestTaskKey(task.id, cfg.id)}
                                      disabled={testingAi}
                                      className="tap px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 text-accent font-bold text-[11px] flex items-center gap-1"
                                      title="Gửi dữ liệu thử nghiệm đúng tác vụ này"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Test tác vụ này</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFromTaskPool(task.id, cfg.id)}
                                      className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px]"
                                      title="Gỡ khỏi nhóm tác vụ này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Task test result alert */}
                                {testRes && (
                                  <div
                                    className={`p-2 rounded text-[11px] ${
                                      testRes.loading
                                        ? 'bg-muted/40 text-muted-foreground'
                                        : testRes.success
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                    }`}
                                  >
                                    {testRes.loading ? '⏳ Đang gửi payload thử nghiệm đúng tác vụ...' : testRes.message}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NỘI DUNG HỌC & TOÀN QUYỀN SỬA/XÓA ADMIN */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="surface p-6 border border-border space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="eyebrow mb-1">KHO TRI THỨC TOÀN HỆ THỐNG</div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                Quản trị toàn bộ nội dung học (Toàn quyền Sửa / Xóa)
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Admin có quyền sửa, xóa riêng lẻ từng bài hoặc xóa cả bộ trên toàn bộ routing chính của ứng dụng.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="tap px-3.5 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Import mới</span>
              </button>
            </div>
          </div>

          {/* Content Category Subtabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border text-xs font-mono">
            {[
              { id: 'universal', label: 'Tài liệu Import', count: universalItems.length, icon: Layers },
              { id: 'exams', label: 'Bộ đề thi', count: examsList.length, icon: FileText },
              { id: 'grammar', label: 'Ngữ pháp', count: computedGrammarList.length, icon: BookOpen },
              { id: 'listening', label: 'Luyện nghe', count: listeningCols.length, icon: Headphones },
              { id: 'situations', label: 'Tình huống', count: computedSituationsList.length, icon: MessageSquare },
              { id: 'vocab', label: 'Từ vựng SRS', count: vocabCards.length, icon: Sparkles },
            ].map((sub) => {
              const SubIcon = sub.icon;
              const isActive = contentSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setContentSubTab(sub.id)}
                  className={`tap px-3 py-1.5 rounded-sm flex items-center gap-2 transition-all shrink-0 ${
                    isActive
                      ? 'bg-accent text-accent-foreground font-bold shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isActive ? 'bg-black/20 text-accent-foreground' : 'bg-muted text-foreground'}`}>
                    {sub.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subtab 1: Universal Imports */}
          {contentSubTab === 'universal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">
                  Gói tài liệu Universal đã nạp ({universalItems.length}):
                </span>
                {universalItems.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Xóa toàn bộ các gói tài liệu Universal đã import?')) {
                        db.universal.clearAll();
                        setUniversalItems([]);
                        toast.success('Đã dọn sạch toàn bộ gói import!');
                      }
                    }}
                    className="tap px-2.5 py-1 text-xs font-mono text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa tất cả</span>
                  </button>
                )}
              </div>

              {universalItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Loại</th>
                        <th className="p-3">Tiêu đề</th>
                        <th className="p-3">Level</th>
                        <th className="p-3">Phạm vi (Scope)</th>
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
                                if (window.confirm(`Xóa gói tài liệu "${item.title}"?`)) {
                                  db.universal.delete(item.id);
                                  setUniversalItems(db.universal.findMany());
                                  toast.success('Đã xóa gói nội dung!');
                                }
                              }}
                              className="tap text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-sm"
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
                  Chưa có gói import nào. Bấm "Import mới" để đưa tài liệu vào.
                </div>
              )}
            </div>
          )}

          {/* Subtab 2: Exams */}
          {contentSubTab === 'exams' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">
                  Danh sách đề thi Goethe, telc, ÖSD ({examsList.length}):
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Khôi phục danh sách toàn bộ đề thi chuẩn gốc của hệ thống?')) {
                      db.exams.resetDefaults();
                      setExamsList(getAllExams());
                      toast.success('Đã khôi phục các đề thi gốc!');
                    }
                  }}
                  className="tap px-2.5 py-1 text-xs font-mono text-muted-foreground hover:text-foreground border border-border rounded-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục đề gốc</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px] sticky top-0 bg-muted">
                    <tr>
                      <th className="p-3">Kỳ thi</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Tên đề thi</th>
                      <th className="p-3">Thời gian</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {examsList.map((ex) => (
                      <tr key={ex.id} className="hover:bg-muted/30">
                        <td className="p-3 font-bold text-accent uppercase">{ex.provider}</td>
                        <td className="p-3 font-bold">{ex.level}</td>
                        <td className="p-3 font-semibold text-foreground">{ex.title}</td>
                        <td className="p-3 text-muted-foreground">{ex.minutes} phút</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setAdminEditingItem({ type: 'exam', data: { ...ex } })}
                              className="tap p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                              title="Sửa đề thi"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa đề thi "${ex.title}" (${ex.provider} ${ex.level})?`)) {
                                  db.exams.delete(ex.id);
                                  setExamsList(getAllExams());
                                  toast.success(`Đã xóa đề thi: ${ex.title}`);
                                }
                              }}
                              className="tap p-1 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 rounded"
                              title="Xóa đề thi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Subtab 3: Grammar */}
          {contentSubTab === 'grammar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">
                  Hệ thống 100 chủ đề Ngữ pháp A1–C2 ({computedGrammarList.length}):
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Khôi phục danh sách 100 chủ đề ngữ pháp gốc của hệ thống?')) {
                      db.grammar.resetDefaults();
                      setGrammarDeletedIds([]);
                      setGrammarOverrides({});
                      toast.success('Đã khôi phục ngữ pháp gốc!');
                    }
                  }}
                  className="tap px-2.5 py-1 text-xs font-mono text-muted-foreground hover:text-foreground border border-border rounded-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục gốc</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px] sticky top-0 bg-muted">
                    <tr>
                      <th className="p-3">Level</th>
                      <th className="p-3">Tiếng Việt</th>
                      <th className="p-3">Tiếng Đức</th>
                      <th className="p-3">Tóm tắt quy tắc</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {computedGrammarList.map((g) => (
                      <tr key={g.id} className="hover:bg-muted/30">
                        <td className="p-3 font-bold text-accent">{g.level}</td>
                        <td className="p-3 font-semibold text-foreground">{g.title_vi}</td>
                        <td className="p-3 text-muted-foreground italic">{g.title_de}</td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">{g.rule}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setAdminEditingItem({ type: 'grammar', data: { ...g } })}
                              className="tap p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                              title="Sửa chủ điểm"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa chủ điểm ngữ pháp "${g.title_vi}"?`)) {
                                  db.grammar.delete(g.id);
                                  setGrammarDeletedIds(db.grammar.getDeletedIds());
                                  toast.success(`Đã xóa chủ điểm: ${g.title_vi}`);
                                }
                              }}
                              className="tap p-1 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 rounded"
                              title="Xóa chủ điểm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Subtab 4: Listening */}
          {contentSubTab === 'listening' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">
                  Danh sách bộ video luyện nghe ({listeningCols.length}):
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Khôi phục danh sách bộ video luyện nghe Nicos Weg gốc?')) {
                      db.listening.resetDefaults();
                      setListeningCols(db.listening.getCollections());
                      toast.success('Đã khôi phục video luyện nghe gốc!');
                    }
                  }}
                  className="tap px-2.5 py-1 text-xs font-mono text-muted-foreground hover:text-foreground border border-border rounded-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục video gốc</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Level</th>
                      <th className="p-3">Tiêu đề bộ</th>
                      <th className="p-3">Kênh / Nguồn</th>
                      <th className="p-3">Số tập</th>
                      <th className="p-3">Phạm vi</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {listeningCols.map((col) => {
                      const epCount = db.listening.getEpisodes(col.id).length;
                      return (
                        <tr key={col.id} className="hover:bg-muted/30">
                          <td className="p-3 font-bold text-accent">{col.level}</td>
                          <td className="p-3 font-semibold text-foreground">{col.title}</td>
                          <td className="p-3 text-muted-foreground">{col.provider}</td>
                          <td className="p-3 font-bold">{epCount} tập</td>
                          <td className="p-3 uppercase text-[10px] font-bold text-accent">{col.scope || 'public'}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setAdminEditingItem({ type: 'listening', data: { ...col } })}
                                className="tap p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                                title="Sửa bộ video"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Xóa bộ video "${col.title}" cùng toàn bộ các tập con?`)) {
                                    db.listening.deleteCollection(col.id);
                                    setListeningCols(db.listening.getCollections());
                                    toast.success(`Đã xóa bộ video: ${col.title}`);
                                  }
                                }}
                                className="tap p-1 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 rounded"
                                title="Xóa bộ video"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 5: Situations */}
          {contentSubTab === 'situations' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">
                  Danh sách tình huống giao tiếp thực tế ({computedSituationsList.length}):
                </span>
                <button
                  onClick={() => {
                    if (window.confirm('Khôi phục danh sách các tình huống giao tiếp gốc?')) {
                      db.situations.resetDefaults();
                      setSituationDeletedIds([]);
                      setSituationOverrides({});
                      toast.success('Đã khôi phục tình huống gốc!');
                    }
                  }}
                  className="tap px-2.5 py-1 text-xs font-mono text-muted-foreground hover:text-foreground border border-border rounded-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Khôi phục tình huống gốc</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Tiếng Việt</th>
                      <th className="p-3">Tiếng Đức</th>
                      <th className="p-3">Số mẫu câu</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {computedSituationsList.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="p-3 font-semibold text-foreground">{s.title_vi}</td>
                        <td className="p-3 text-muted-foreground italic">{s.title_de}</td>
                        <td className="p-3 font-bold text-accent">{s.phrases?.length || 0} câu</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setAdminEditingItem({ type: 'situation', data: { ...s } })}
                              className="tap p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                              title="Sửa tình huống"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa tình huống "${s.title_vi}"?`)) {
                                  db.situations.delete(s.id);
                                  setSituationDeletedIds(db.situations.getDeletedIds());
                                  toast.success(`Đã xóa tình huống: ${s.title_vi}`);
                                }
                              }}
                              className="tap p-1 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 rounded"
                              title="Xóa tình huống"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* Subtab 6: Vocabulary */}
          {contentSubTab === 'vocab' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-foreground">
                  Thẻ từ vựng SRS trong cơ sở dữ liệu ({vocabCards.length}):
                </span>
                {vocabCards.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Xóa toàn bộ ${vocabCards.length} thẻ từ vựng trong hệ thống? Thao tác này không thể hoàn tác.`)) {
                        db.vocabulary.clearAll();
                        setVocabCards([]);
                        toast.success('Đã xóa toàn bộ thẻ từ vựng!');
                      }
                    }}
                    className="tap px-2.5 py-1 text-xs font-mono text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa toàn bộ thẻ từ vựng</span>
                  </button>
                )}
              </div>

              {vocabCards.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted/50 border-y border-border text-muted-foreground uppercase text-[10px] sticky top-0 bg-muted">
                      <tr>
                        <th className="p-3">Từ vựng (DE)</th>
                        <th className="p-3">Nghĩa (VI)</th>
                        <th className="p-3">Cấp độ</th>
                        <th className="p-3">Chủ đề</th>
                        <th className="p-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vocabCards.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/30">
                          <td className="p-3 font-bold text-foreground">{c.german}</td>
                          <td className="p-3 text-accent font-medium">{c.vietnamese}</td>
                          <td className="p-3">{c.level || 'B1'}</td>
                          <td className="p-3 text-muted-foreground">{c.topic || 'Chung'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                db.vocabulary.delete(c.id);
                                setVocabCards(db.vocabulary.findMany());
                                toast.success(`Đã xóa từ: ${c.german}`);
                              }}
                              className="tap p-1 hover:bg-rose-50 text-muted-foreground hover:text-rose-600 rounded"
                              title="Xóa từ này"
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
                  Chưa có thẻ từ vựng nào trong kho SRS.
                </div>
              )}
            </div>
          )}
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

      {/* Admin Quick Edit Modal */}
      {adminEditingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface p-6 max-w-lg w-full space-y-4 rounded-sm border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="eyebrow">Quản trị viên</span>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Chỉnh sửa: {adminEditingItem.data.title || adminEditingItem.data.title_vi}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminEditingItem(null)}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const { type, data } = adminEditingItem;
                if (type === 'exam') {
                  db.exams.update(data.id, {
                    title: data.title,
                    provider: data.provider,
                    level: data.level,
                    minutes: Number(data.minutes) || 60,
                  });
                  setExamsList(getAllExams());
                } else if (type === 'grammar') {
                  db.grammar.update(data.id, {
                    title_vi: data.title_vi,
                    title_de: data.title_de,
                    level: data.level,
                    rule: data.rule,
                  });
                  setGrammarOverrides(db.grammar.getOverrides());
                } else if (type === 'listening') {
                  db.listening.updateCollection(data.id, {
                    title: data.title,
                    deTitle: data.deTitle,
                    level: data.level,
                    provider: data.provider,
                    description: data.description,
                    scope: data.scope,
                  });
                  setListeningCols(db.listening.getCollections());
                } else if (type === 'situation') {
                  db.situations.update(data.id, {
                    title_vi: data.title_vi,
                    title_de: data.title_de,
                    desc: data.desc,
                  });
                  setSituationOverrides(db.situations.getOverrides());
                }
                setAdminEditingItem(null);
                toast.success('Đã lưu thay đổi từ Quản trị viên!');
              }}
              className="space-y-3 text-xs"
            >
              {/* Exam Fields */}
              {adminEditingItem.type === 'exam' && (
                <>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Tên đề thi *</label>
                    <input
                      type="text"
                      required
                      value={adminEditingItem.data.title || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-mono text-muted-foreground uppercase text-[10px]">Kỳ thi</label>
                      <input
                        type="text"
                        value={adminEditingItem.data.provider || ''}
                        onChange={(e) =>
                          setAdminEditingItem({
                            ...adminEditingItem,
                            data: { ...adminEditingItem.data, provider: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-muted-foreground uppercase text-[10px]">Cấp độ</label>
                      <select
                        value={adminEditingItem.data.level || 'B1'}
                        onChange={(e) =>
                          setAdminEditingItem({
                            ...adminEditingItem,
                            data: { ...adminEditingItem.data, level: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                      >
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-muted-foreground uppercase text-[10px]">Thời lượng</label>
                      <input
                        type="number"
                        value={adminEditingItem.data.minutes || 60}
                        onChange={(e) =>
                          setAdminEditingItem({
                            ...adminEditingItem,
                            data: { ...adminEditingItem.data, minutes: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Grammar Fields */}
              {adminEditingItem.type === 'grammar' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="font-mono text-muted-foreground uppercase text-[10px]">Tiêu đề tiếng Việt *</label>
                      <input
                        type="text"
                        required
                        value={adminEditingItem.data.title_vi || ''}
                        onChange={(e) =>
                          setAdminEditingItem({
                            ...adminEditingItem,
                            data: { ...adminEditingItem.data, title_vi: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-muted-foreground uppercase text-[10px]">Level</label>
                      <select
                        value={adminEditingItem.data.level || 'B1'}
                        onChange={(e) =>
                          setAdminEditingItem({
                            ...adminEditingItem,
                            data: { ...adminEditingItem.data, level: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                      >
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Tiêu đề tiếng Đức</label>
                    <input
                      type="text"
                      value={adminEditingItem.data.title_de || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, title_de: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Nội dung quy tắc</label>
                    <textarea
                      rows={3}
                      value={adminEditingItem.data.rule || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, rule: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground font-sans"
                    />
                  </div>
                </>
              )}

              {/* Listening Collection Fields */}
              {adminEditingItem.type === 'listening' && (
                <>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Tên bộ video *</label>
                    <input
                      type="text"
                      required
                      value={adminEditingItem.data.title || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, title: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-mono text-muted-foreground uppercase text-[10px]">Level</label>
                      <select
                        value={adminEditingItem.data.level || 'B1'}
                        onChange={(e) =>
                          setAdminEditingItem({
                            ...adminEditingItem,
                            data: { ...adminEditingItem.data, level: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                      >
                        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-muted-foreground uppercase text-[10px]">Phạm vi (Scope)</label>
                      <select
                        value={adminEditingItem.data.scope || 'public'}
                        onChange={(e) =>
                          setAdminEditingItem({
                            ...adminEditingItem,
                            data: { ...adminEditingItem.data, scope: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                      >
                        <option value="public">Toàn hệ thống (Public)</option>
                        <option value="private">Cá nhân (Private)</option>
                        <option value="admin_only">Nội bộ Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Kênh / Nguồn</label>
                    <input
                      type="text"
                      value={adminEditingItem.data.provider || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, provider: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                    />
                  </div>
                </>
              )}

              {/* Situation Fields */}
              {adminEditingItem.type === 'situation' && (
                <>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Tiêu đề tiếng Việt *</label>
                    <input
                      type="text"
                      required
                      value={adminEditingItem.data.title_vi || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, title_vi: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Tiêu đề tiếng Đức</label>
                    <input
                      type="text"
                      value={adminEditingItem.data.title_de || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, title_de: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-muted-foreground uppercase text-[10px]">Mô tả</label>
                    <textarea
                      rows={2}
                      value={adminEditingItem.data.desc || ''}
                      onChange={(e) =>
                        setAdminEditingItem({
                          ...adminEditingItem,
                          data: { ...adminEditingItem.data, desc: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdminEditingItem(null)}
                  className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted font-mono"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="tap px-4 py-1.5 rounded-sm bg-accent text-accent-foreground font-mono font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminPage;
