import {previewModelSuggestions} from '@/lib/model-previews.js';
import {elioAIAdmin} from '@/lib/elio-ai-admin-runtime';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, isSystemAdminEmail } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import {
  AI_PROVIDERS,
  FREE_AI_MODELS,
  APP_AI_TASKS,
} from '@/data/ai-models-catalog';
import { testAiConnection, testAiTaskSpecific } from '@/lib/ai-evaluator';
import { showConfirmModal } from '@/components/ui/ConfirmModal';
import { ModelCatalogModal } from '@/components/admin/ModelCatalogModal';
import {
  discoverProviderModels,
  verifyProviderKey,
  maskApiKey,
  getCachedCatalog,
  getSmartRecommendations,
  DEFAULT_AI_POLICY,
} from '@/lib/dynamic-model-discovery';
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

  // Master Admin verification (Strictly role === 'admin' or system admin email)
  const currentUser = db.auth.getUser();
  const isAdmin = Boolean(
    currentUser?.role === 'admin' ||
    isSystemAdminEmail(currentUser?.email) ||
    db.auth.isAdmin()
  );

  // Listen to auth changes
  useEffect(() => {
    const handleAuth = () => {
      const u = db.auth.getUser();
      const hasAdmin = Boolean(
        u?.role === 'admin' ||
        isSystemAdminEmail(u?.email) ||
        db.auth.isAdmin()
      );
      if (!u || !hasAdmin) {
        navigate('/');
      }
    };
    window.addEventListener('sprach_auth_change', handleAuth);
    return () => window.removeEventListener('sprach_auth_change', handleAuth);
  }, [navigate]);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="eyebrow text-rose-600">TRUY CẬP HẠN CHẾ</div>
        <h2 className="font-display text-2xl font-bold text-foreground">
          Khu vực dành riêng cho Quản trị viên
        </h2>
        <p className="font-body text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Tài khoản hiện tại ({currentUser?.email || 'Học viên'}) không có thẩm quyền Quản trị viên (Super Admin).
          Vui lòng đăng nhập bằng tài khoản có quyền quản trị để truy cập trang này.
        </p>
        <div className="pt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="tap px-5 py-2.5 rounded-sm bg-accent text-accent-foreground font-mono text-xs font-semibold shadow-sm"
          >
            ← Về trang học tập
          </button>
        </div>
      </div>
    );
  }

  // AI State
  const [aiConfigs, setAiConfigs] = useState(() => db.aiConfig.getConfigs());
  const [aiAssignments, setAiAssignments] = useState(() => db.aiConfig.getAssignments());

  // Form New AI
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState('gemini');
  const [selectedModel, setSelectedModel] = useState(()=>elioAIAdmin()?.isActive()?'':'gemini-2.5-flash');
  const [backupModel, setBackupModel] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');
  const [isCustomModelMode, setIsCustomModelMode] = useState(false);
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [priority, setPriority] = useState(1);
  const [hasVision, setHasVision] = useState(true);
  const [testingAi, setTestingAi] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [taskPoolResults, setTaskPoolResults] = useState({});

  // Dynamic Model Discovery & Policies State
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState(() => {
    const cached = getCachedCatalog('gemini');
    return cached?.models || [];
  });
  const [smartRecs, setSmartRecs] = useState(() => {
    const cached = getCachedCatalog('gemini');
    return cached?.models ? getSmartRecommendations(cached.models) : elioAIAdmin()?.isActive()?previewModelSuggestions('gemini'):[];
  });
  const [discoveryMeta, setDiscoveryMeta] = useState(() => {
    const cached = getCachedCatalog('gemini');
    return cached ? { totalCount: cached.count, freeCount: cached.freeCount, syncedAt: cached.lastSyncedAt } : null;
  });
  const [aiPolicies, setAiPolicies] = useState(() => db.aiConfig?.getPolicies?.() || DEFAULT_AI_POLICY);

  // Model Catalog Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [activeCatalogConfig, setActiveCatalogConfig] = useState(null);
  const [activeCatalogProvider, setActiveCatalogProvider] = useState('gemini');
  const [activeCatalogModels, setActiveCatalogModels] = useState([]);

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
      setAiConfigs(db.aiConfig.getConfigs());setAiAssignments(db.aiConfig.getAssignments());setAiPolicies(db.aiConfig.getPolicies());
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

  useEffect(()=>{if(!elioAIAdmin()?.isActive())return;elioAIAdmin().hydrate().catch(error=>toast.error(error.message));const timer=setInterval(()=>setAiConfigs(db.aiConfig.getConfigs()),1000);return()=>clearInterval(timer);},[]);

  // Sync discovered catalog when provider type changes
  useEffect(() => {
    if(elioAIAdmin()?.isActive()){setApiKey('');setBackupModel('');}
    const cached = getCachedCatalog(providerType);
    let currentModels = [];
    if (cached && cached.models?.length > 0) {
      setDiscoveredModels(cached.models);
      setSmartRecs(getSmartRecommendations(cached.models));
      setDiscoveryMeta({ totalCount: cached.count, freeCount: cached.freeCount, syncedAt: cached.lastSyncedAt });
      currentModels = cached.models;
    } else {
      setDiscoveredModels([]);
      setSmartRecs(elioAIAdmin()?.isActive()?previewModelSuggestions(providerType):[]);
      setDiscoveryMeta(null);
      currentModels = elioAIAdmin()?.isActive()?previewModelSuggestions(providerType):FREE_AI_MODELS.filter((m) => m.provider === providerType);
      if(elioAIAdmin()?.isActive())setSelectedModel('');
    }

    // Auto-select the top newest model for this provider if current model doesn't belong to it
    const exists = currentModels.some((m) => m.id === selectedModel);
    if (!exists && currentModels.length > 0) {
      const topModel = currentModels[0];
      setSelectedModel(topModel.id);
      setHasVision(Boolean(topModel.capabilities?.vision || topModel.hasVision));
    }
  }, [providerType]);

  // Models available for current provider: dynamically discovered or fallback
  const availableModelsForProvider = useMemo(() => {
    if (discoveredModels.length > 0) {
      return discoveredModels;
    }
    const cached = getCachedCatalog(providerType);
    if (cached?.models?.length > 0) {
      return cached.models;
    }
    if(elioAIAdmin()?.isActive())return previewModelSuggestions(providerType);
    // Safe initial seed from catalog
    return FREE_AI_MODELS.filter((m) => m.provider === providerType).map((m) => ({
      id: m.id,
      rawId: m.id,
      name: m.name,
      provider: m.provider,
      desc: m.desc,
      speed: m.speed,
      badge: m.badge,
      hasVision: m.hasVision,
      isNew: m.isNew,
      contextWindow: m.speed,
      capabilities: { text: true, vision: m.hasVision, audio: false, reasoning: m.isNew },
      pricing: { isFree: true, tier: 'FREE_ELIGIBLE', note: m.badge },
    }));
  }, [discoveredModels, providerType]);

  const handleSelectSuggestedModel = (model) => {
    setSelectedModel(model.id);
    setIsCustomModelMode(false);
    if(!elioAIAdmin()?.isActive()||model.capabilities?.vision!==undefined||model.hasVision!==undefined)setHasVision(Boolean(model.capabilities?.vision || model.hasVision));
    if (!providerName) {
      setProviderName(`${model.name || model.id}`);
    }
  };

  const handleDiscoverModels = async (keyOverride = null, prov = providerType) => {
    const targetKey = keyOverride !== null ? keyOverride : apiKey;
    if (!targetKey?.trim() && prov !== 'custom') {
      toast.error(`Vui lòng nhập API Key cho ${prov.toUpperCase()} trước khi khám phá danh mục model.`);
      return;
    }
    setIsDiscovering(true);
    toast.loading(`Đang kết nối API chính thức của ${prov.toUpperCase()} để lấy danh mục model thực tế...`, {
      id: 'live-discover',
    });
    try {
      const res = await discoverProviderModels({
        provider: prov,
        apiKey: targetKey,
        baseUrl: customBaseUrl,
      });

      setDiscoveredModels(res.models || []);
      setSmartRecs(res.recommendations || []);
      setDiscoveryMeta({
        totalCount: res.totalCount,
        freeCount: res.freeCount,
        syncedAt: res.syncedAt,
        source: res.source,
      });

      if (res.recommendations?.[0]) {
        setSelectedModel(res.recommendations[0].id);
        if(!elioAIAdmin()?.isActive()||res.recommendations[0].capabilities?.vision!==undefined)setHasVision(Boolean(res.recommendations[0].capabilities?.vision));
        if (res.recommendations[1]) {
          setBackupModel(res.recommendations[1].id);
        }
      }

      toast.success(
        `Đã phát hiện ${res.totalCount} model thực tế từ ${prov.toUpperCase()} (${res.freeCount} Free Tier)!`,
        { id: 'live-discover' }
      );
    } catch (err) {
      toast.error(`Khám phá thất bại: ${err.message}`, { id: 'live-discover' });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleOpenCatalogModal = async (config = null) => {
    if(elioAIAdmin()?.isActive()){
      try{const provider=config?.provider||providerType;const result=await discoverProviderModels({provider,apiKey:apiKey.trim(),configId:config?.id});setActiveCatalogConfig(config);setActiveCatalogProvider(provider);setActiveCatalogModels(result.models);setIsCatalogModalOpen(true);}catch(error){toast.error(error.message);}return;
    }
    if (config) {
      // Existing active config
      setActiveCatalogConfig(config);
      setActiveCatalogProvider(config.provider);
      const cached = getCachedCatalog(config.provider);
      if (cached?.models?.length > 0) {
        setActiveCatalogModels(cached.models);
      } else {
        const fallbacks = FREE_AI_MODELS.filter((m) => m.provider === config.provider).map((m) => ({
          id: m.id,
          rawId: m.id,
          name: m.name,
          provider: config.provider,
          desc: m.desc,
          capabilities: { text: true, vision: m.hasVision, reasoning: m.isNew },
          pricing: { isFree: true, tier: 'FREE_ELIGIBLE', note: m.badge },
        }));
        setActiveCatalogModels(fallbacks);
      }
    } else {
      // New form
      setActiveCatalogConfig(null);
      setActiveCatalogProvider(providerType);
      setActiveCatalogModels(
        discoveredModels.length > 0
          ? discoveredModels
          : FREE_AI_MODELS.filter((m) => m.provider === providerType).map((m) => ({
              id: m.id,
              rawId: m.id,
              name: m.name,
              provider: providerType,
              desc: m.desc,
              capabilities: { text: true, vision: m.hasVision, reasoning: m.isNew },
              pricing: { isFree: true, tier: 'FREE_ELIGIBLE', note: m.badge },
            }))
      );
    }
    setIsCatalogModalOpen(true);
  };

  const handleSelectPrimaryFromModal = async (modelId, modelObj) => {
    if (activeCatalogConfig) {
      const updated = {
        ...activeCatalogConfig,
        model: modelId,
        hasVision: elioAIAdmin()?.isActive()&&modelObj?.capabilities?.vision===undefined?activeCatalogConfig.hasVision:Boolean(modelObj?.capabilities?.vision),
        tier: modelObj?.pricing?.tier || 'UNKNOWN',
      };
      await db.aiConfig.saveConfig(updated);
      if(elioAIAdmin()?.isActive())setTestResults(previous=>{const next={...previous};delete next[updated.id];return next;});
      setAiConfigs(db.aiConfig.getConfigs());
    } else {
      setSelectedModel(modelId);
      if(!elioAIAdmin()?.isActive()||modelObj?.capabilities?.vision!==undefined)setHasVision(Boolean(modelObj?.capabilities?.vision));
      if (!providerName) {
        setProviderName(modelObj?.name || modelId);
      }
    }
  };

  const handleSelectBackupFromModal = async (modelId, modelObj) => {
    if (activeCatalogConfig) {
      const updated = {
        ...activeCatalogConfig,
        backupModel: modelId,
      };
      await db.aiConfig.saveConfig(updated);
      if(elioAIAdmin()?.isActive())setTestResults(previous=>{const next={...previous};delete next[updated.id];return next;});
      setAiConfigs(db.aiConfig.getConfigs());
    } else {
      setBackupModel(modelId);
    }
  };

  const handlePolicyToggle = async (key, val) => {
    try {const updated = await db.aiConfig.updatePolicies({ [key]: val });
    setAiPolicies(updated);if(elioAIAdmin()?.isActive())setSmartRecs(getSmartRecommendations(discoveredModels));
    toast.success(`Đã cập nhật chính sách AI: ${key} = ${val ? 'BẬT' : 'TẮT'}`);
    }catch(error){toast.error(error.message);}
  };

  const handleSyncConfigModels = async (cfg) => {
    toast.loading(`Đang đồng bộ model mới từ ${cfg.provider.toUpperCase()}...`, { id: `sync-${cfg.id}` });
    try {
      const res = await discoverProviderModels({
        provider: cfg.provider,
        apiKey: cfg.apiKey,
        configId:cfg.id,
        baseUrl: cfg.baseUrl,
      });
      toast.success(`Đã cập nhật ${res.totalCount} model (${res.freeCount} Free Tier)!`, { id: `sync-${cfg.id}` });
      if (providerType === cfg.provider) {
        setDiscoveredModels(res.models);
        setSmartRecs(res.recommendations);
        setDiscoveryMeta({ totalCount: res.totalCount, freeCount: res.freeCount, syncedAt: res.syncedAt });
      }
    } catch (err) {
      toast.error(`Đồng bộ thất bại: ${err.message}`, { id: `sync-${cfg.id}` });
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
      // Auto-trigger discovery if not discovered yet
      if (discoveredModels.length === 0) {
        handleDiscoverModels(apiKey.trim(), providerType);
      }
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

  const handleAddAIConfig = async (e) => {
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
    if (!apiKey.trim() && providerType !== 'custom') {
      toast.error('Vui lòng dán mã API Key!');
      return;
    }
    const newConfig = {
      id: `ai-cfg-${Date.now()}`,
      name: providerName || `${providerType.toUpperCase()} - ${finalModel}`,
      provider: providerType,
      model: finalModel,
      backupModel: backupModel.trim() || null,
      apiKey: apiKey.trim(),
      maskedKey: maskApiKey(apiKey),
      baseUrl: providerType === 'custom' ? customBaseUrl.trim() : undefined,
      hasVision: Boolean(hasVision),
      priority: Number(priority) || 1,
      enabled: true,
      discoveredAt: new Date().toISOString(),
    };
    try {await db.aiConfig.saveConfig(newConfig);
    setAiConfigs(db.aiConfig.getConfigs());
    setProviderName('');
    setApiKey('');
    setBackupModel('');
    setCustomModelInput('');
    toast.success(`Đã thêm cấu hình AI: ${newConfig.name}!`);
    }catch(error){toast.error(error.message);}
  };

  const handleDeleteAIConfig = async (id) => {
    try {await db.aiConfig.deleteConfig(id);
    setAiConfigs(db.aiConfig.getConfigs());
    toast.success('Đã xóa cấu hình AI!');
    }catch(error){toast.error(error.message);}
  };

  const handleAssignTask = async (taskId, provId, modelId) => {
    try{await db.aiConfig.setAssignment(taskId, provId, modelId);
    setAiAssignments(db.aiConfig.getAssignments());
    toast.success('Đã cập nhật phân công AI cho tác vụ!');
    }catch(error){toast.error(error.message);}
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

    try{await db.aiConfig.addToTaskPool(taskId, configId);}catch(error){toast.error(error.message);return;}
    setAiConfigs([...db.aiConfig.getConfigs()]);
    toast.success(`Đã thêm Key "${config.name}" vào nhóm tác vụ "${task.name}"!`);
    handleTestTaskKey(taskId, configId);
  };

  const handleRemoveFromTaskPool = async (taskId, configId) => {
    try{await db.aiConfig.removeFromTaskPool(taskId, configId);}catch(error){toast.error(error.message);return;}
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

  const handleDeleteUser = async (id) => {
    const ok = await showConfirmModal({
      title: 'Xóa tài khoản người dùng',
      message: 'Bạn có chắc muốn xóa tài khoản này khỏi hệ thống không? Dữ liệu tiến độ học của tài khoản này sẽ bị xóa vĩnh viễn.',
      confirmText: 'Xóa tài khoản',
      variant: 'danger',
    });
    if (ok) {
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

      {activeTab === 'ai' && (
        <div className="space-y-6 animate-fade-in">
          {/* AI Policy & Free-Tier First Controls */}
          <div className="surface p-5 rounded-sm border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
              <div>
                <div className="eyebrow text-emerald-700 dark:text-emerald-400">CHÍNH SÁCH QUẢN TRỊ AI · FREE TIER FIRST</div>
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Ưu tiên Model Miễn Phí & Kiểm soát Chi Phí Zero-Cost</span>
                </h3>
              </div>
              <div className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1.5 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live API Discovery · Zero Hardcoded Models</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <label className="flex items-start gap-2.5 p-3 rounded-sm border border-emerald-500/20 bg-background/80 cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(aiPolicies.FREE_ONLY)}
                  onChange={(e) => handlePolicyToggle('FREE_ONLY', e.target.checked)}
                  className="mt-0.5 rounded-sm border-border text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-foreground">Chỉ dùng Free Tier (FREE_ONLY)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Chỉ gọi các model hoàn toàn miễn phí hoặc trong hạn mức free tier được xác thực.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-sm border border-emerald-500/20 bg-background/80 cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(aiPolicies.FREE_FIRST_SORT)}
                  onChange={(e) => handlePolicyToggle('FREE_FIRST_SORT', e.target.checked)}
                  className="mt-0.5 rounded-sm border-border text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-foreground">Ưu tiên Free lên đầu (FREE_FIRST)</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Tự động xếp model miễn phí lên vị trí đầu trong danh mục và danh sách gợi ý.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-sm border border-emerald-500/20 bg-background/80 cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(aiPolicies.ALLOW_PAID_MODELS)}
                  onChange={(e) => handlePolicyToggle('ALLOW_PAID_MODELS', e.target.checked)}
                  className="mt-0.5 rounded-sm border-border text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="font-bold text-foreground">Cho phép model trả phí</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Kích hoạt để chọn model tính phí. Cần Admin xác nhận khi kích hoạt model thương mại.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-sm border border-emerald-500/20 bg-background/80 cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(aiPolicies.AUTO_PAID_FALLBACK)}
                  onChange={(e) => handlePolicyToggle('AUTO_PAID_FALLBACK', e.target.checked)}
                  className="mt-0.5 rounded-sm border-border text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="font-bold text-foreground">Không tự nhảy sang trả phí</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Tuyệt đối không bao giờ tự động chuyển sang model có phí khi model free hết hạn mức.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Section 1: API AI · Ưu tiên & dự phòng */}
          <div className="surface p-6 border border-border space-y-5">
            <div>
              <div className="eyebrow mb-1">CẤU HÌNH NHÀ CUNG CẤP & KHÁM PHÁ MODEL THỰC TẾ</div>
              <h3 className="font-display text-xl font-bold text-foreground">
                API Key Management & Dynamic Model Discovery
              </h3>
              <p className="font-body text-xs text-muted-foreground mt-0.5">
                Sprachmeisterschaft kết nối trực tiếp với API chính thức của nhà cung cấp để lấy model thực tế, không dùng model hardcode tĩnh.
              </p>
            </div>

            {/* Add new AI config form */}
            <form
              onSubmit={handleAddAIConfig}
              autoComplete="off"
              className="p-4 rounded-sm bg-muted/20 border border-border space-y-4"
            >
              <div className="font-mono text-xs font-bold text-foreground flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" />
                  <span>+ Thêm cấu hình API AI & Khám phá Model</span>
                </div>
                {discoveryMeta && (
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Đã tải {discoveryMeta.totalCount} model thực tế ({discoveryMeta.freeCount} Free Tier)
                  </span>
                )}
              </div>

              {/* Row 1: Alias, Provider, Base URL */}
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
                    placeholder={elioAIAdmin()?.isActive()?'Ví dụ: Cấu hình Gemini học tiếng Đức':'Ví dụ: Google Gemini 2.5 Flash Free'}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    Nhà cung cấp (10 Providers) *
                  </label>
                  <select
                    name="elio_ai_provider_select"
                    value={providerType}
                    onChange={(e) => {
                      const p = e.target.value;
                      setProviderType(p);
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
                      Model chính chỉ định *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomModelMode(!isCustomModelMode)}
                      className="text-[10px] font-mono text-accent hover:underline font-bold"
                    >
                      {isCustomModelMode ? '← Danh mục' : '+ Tự gõ'}
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
                          toast.warning('Ô này chỉ để nhập mã Model AI, không phải địa chỉ email!');
                          return;
                        }
                        setCustomModelInput(val);
                      }}
                      placeholder="Gõ mã model (vd: gemini-2.5-flash, llama-3.3-70b-versatile...)"
                      className="w-full px-3 py-2 text-xs rounded-sm border border-accent bg-card text-accent font-mono font-bold"
                    />
                  ) : (
                    <select
                      name="elio_ai_model_select"
                      value={selectedModel}
                      onChange={(e) => {
                        const mId = e.target.value;
                        setSelectedModel(mId);
                        const m = availableModelsForProvider.find((x) => x.id === mId);
                        if (m) setHasVision(Boolean(m.capabilities?.vision || m.hasVision));
                      }}
                      className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono font-bold text-accent"
                    >
                      {availableModelsForProvider.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.id} {m.capabilities?.vision || m.hasVision ? '📷 Đọc ảnh' : ''} {m.pricing?.isFree ? '· Free' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Row 2: API Key with Live Discovery Button */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-8">
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    API Key ({providerType.toUpperCase()}) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      name="elio_custom_ai_secret_key"
                      autoComplete="new-password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Dán mã API Key của ${providerType.toUpperCase()} vào đây...`}
                      className="flex-1 px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                    />
                    <button
                      type="button"
                      disabled={isDiscovering || (!apiKey.trim() && providerType !== 'custom')}
                      onClick={() => handleDiscoverModels()}
                      className="tap px-3 py-2 rounded-sm bg-accent/10 hover:bg-accent/20 border border-accent/40 text-accent text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                      title="Kết nối API chính thức và lấy danh mục model thực tế"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isDiscovering ? 'animate-spin' : ''}`} />
                      <span>{isDiscovering ? 'Đang khám phá...' : 'Khám phá Model (Live)'}</span>
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-mono text-foreground mb-1">
                    Model dự phòng (Backup Failover)
                  </label>
                  <select
                    value={backupModel}
                    onChange={(e) => setBackupModel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-border bg-card text-foreground font-mono"
                  >
                    <option value="">-- Không dùng model dự phòng --</option>
                    {availableModelsForProvider
                      .filter((m) => m.id !== selectedModel)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name || m.id} {m.pricing?.isFree ? '(Free)' : ''}
                        </option>
                      ))}
                  </select>
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

              {/* Dynamic Discovery Status Bar & Catalog Opener */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-sm border border-border/80 bg-background/60">
                <div className="flex items-center gap-2 text-xs font-mono">
                  {discoveryMeta ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-foreground">
                        Đã tải <strong className="text-accent">{discoveryMeta.totalCount} model</strong> thực tế từ API chính thức ({discoveryMeta.freeCount} Free Tier)
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-muted-foreground">
                        Nhập API Key và bấm <strong>"Khám phá Model (Live)"</strong> để đồng bộ model thực tế từ API chính thức.
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCatalogModal(null)}
                  className="tap px-3 py-1.5 rounded-sm border border-accent bg-accent/5 hover:bg-accent/15 text-accent text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Xem toàn bộ danh mục & Đổi model ({availableModelsForProvider.length})</span>
                </button>
              </div>

              {/* Smart Recommendations Grid */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Gợi ý model ưu tiên (Top Free-Tier & Multimodal) · Bấm để chọn làm Model chính:</span>
                  <span className="text-accent text-[10px] font-semibold">Free Tier First Recommendations</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(smartRecs.length > 0 ? smartRecs : availableModelsForProvider.slice(0, 8)).map((m) => {
                    const isSelected = selectedModel === m.id && !isCustomModelMode;
                    const isBackup = backupModel === m.id;
                    const isFree = m.pricing?.isFree || m.pricing?.tier === 'VERIFIED_FREE' || m.pricing?.tier === 'FREE_ELIGIBLE';
                    const hasVisionFlag = m.capabilities?.vision || m.hasVision;

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectSuggestedModel(m)}
                        className={`tap p-3 rounded-sm border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-accent bg-accent/10 ring-1 ring-accent'
                            : isBackup
                            ? 'border-blue-500/50 bg-blue-50/20'
                            : 'border-border bg-card hover:bg-muted/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1 gap-1">
                            <span className="font-mono text-xs font-bold text-foreground truncate">
                              {m.name || m.id}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isFree ? (
                                <span className="px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-mono font-bold">
                                  FREE
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded-sm bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] font-mono font-bold">
                                  {m.preview?'GỢI Ý':m.pricing?.tier==='UNKNOWN'?'TÙY TÀI KHOẢN':'PAID'}
                                </span>
                              )}
                              {hasVisionFlag && (
                                <span className="px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 text-[9px] font-mono font-bold">
                                  📷 Vision
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] font-mono text-accent truncate">
                            {m.rawId || m.id}
                          </div>
                          <p className="text-[11px] font-body text-muted-foreground line-clamp-2 mt-1">
                            {m.desc || `${m.provider.toUpperCase()} AI Model`}
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-border/80 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                          <span>{m.contextWindow || (elioAIAdmin()?.isActive()?'Chưa rõ context':'128k context')}</span>
                          {isSelected && <span className="text-accent font-bold">✓ ĐANG CHỌN</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority & Vision & Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
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

                <div className="sm:col-span-8 flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-foreground pb-2">
                    <input
                      type="checkbox"
                      checked={hasVision}
                      onChange={(e) => setHasVision(e.target.checked)}
                      className="rounded-sm border-border text-accent focus:ring-accent"
                    />
                    <span>Hỗ trợ đọc ảnh (Multimodal Vision: Gemini / Claude / GPT-4o / Groq Vision / OpenRouter)</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-border/80">
                <button
                  type="button"
                  disabled={testingAi || (!apiKey.trim() && providerType !== 'custom')}
                  onClick={handleTestDraftConfig}
                  className="tap px-3.5 py-2 rounded-sm border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-mono font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{testingAi ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Test Key)'}</span>
                </button>

                <button
                  type="submit"
                  className="tap px-5 py-2 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm API AI</span>
                </button>
              </div>
            </form>

            {/* Configured AI List */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono font-bold text-foreground flex items-center justify-between">
                <span>Danh sách API AI đang hoạt động ({aiConfigs.length}):</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Khóa được bảo vệ · Click "Đổi model" để chọn từ danh mục khám phá
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {aiConfigs.map((cfg) => {
                  const testRes = testResults[cfg.id];
                  const cooldown = db.aiConfig?.getKeyCooldown?.(cfg.id);
                  const inCooldown = cooldown && cooldown.until > Date.now();
                  const cooldownSec = inCooldown ? Math.ceil((cooldown.until - Date.now()) / 1000) : 0;

                  return (
                    <div
                      key={cfg.id}
                      className="p-3.5 rounded-sm border border-border bg-card flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            inCooldown
                              ? 'bg-amber-500 ring-2 ring-amber-300 animate-pulse'
                              : testRes
                              ? testRes.success
                                ? 'bg-emerald-500 ring-2 ring-emerald-300'
                                : 'bg-rose-500 ring-2 ring-rose-300'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-foreground">{cfg.name}</span>
                            <span className="px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent font-bold text-[10px]">
                              {cfg.provider.toUpperCase()}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-sm bg-muted text-foreground font-bold text-[10px]">
                              {cfg.model}
                            </span>
                            {cfg.backupModel && (
                              <span className="px-1.5 py-0.5 rounded-sm bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px]">
                                Backup: {cfg.backupModel}
                              </span>
                            )}
                            {cfg.hasVision && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                                📷 Vision
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({cfg.maskedKey || maskApiKey(cfg.apiKey)})
                            </span>
                          </div>
                          {inCooldown && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-bold">
                              ⏸️ Đang giãn cách Cooldown {cooldown.status||429} ({cooldownSec}s còn lại) · Tự động dùng key dự phòng
                            </div>
                          )}
                          {testRes && (
                            <div
                              className={`text-[10px] mt-0.5 ${
                                testRes.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
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
                          onClick={() => handleOpenCatalogModal(cfg)}
                          className="tap px-2.5 py-1.5 rounded-sm bg-accent/10 hover:bg-accent/20 text-accent font-bold text-[11px] flex items-center gap-1 border border-accent/30"
                          title="Mở danh mục để đổi model chính hoặc dự phòng"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Đổi model</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSyncConfigModels(cfg)}
                          className="tap px-2 py-1.5 rounded-sm bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 border border-border"
                          title="Đồng bộ danh mục model thực tế từ API"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Đồng bộ</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTestActiveConfig(cfg)}
                          className="tap px-2.5 py-1.5 rounded-sm bg-muted/50 hover:bg-muted text-foreground font-semibold text-[11px] flex items-center gap-1 border border-border"
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
                                        ⏸️ Cooldown {cooldown.status||429} ({cooldownSec}s)
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
                    onClick={async () => {
                      const ok = await showConfirmModal({
                        title: 'Xóa toàn bộ tài liệu Universal',
                        message: 'Bạn có chắc muốn xóa toàn bộ các gói tài liệu Universal đã import không? Thao tác này không thể hoàn tác.',
                        confirmText: 'Xóa toàn bộ',
                        variant: 'danger',
                      });
                      if (ok) {
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
                              onClick={async () => {
                                const ok = await showConfirmModal({
                                  title: 'Xóa gói tài liệu',
                                  message: `Bạn có chắc muốn xóa gói tài liệu "${item.title}" (${item.content_type?.toUpperCase() || 'Tài liệu'}) không?`,
                                  confirmText: 'Xóa gói này',
                                  variant: 'danger',
                                });
                                if (ok) {
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
                  onClick={async () => {
                    const ok = await showConfirmModal({
                      title: 'Khôi phục danh sách đề thi',
                      message: 'Khôi phục danh sách toàn bộ đề thi chuẩn gốc của hệ thống (Goethe, telc, ÖSD)? Các đề thi tự tạo sẽ được bảo toàn.',
                      confirmText: 'Khôi phục đề gốc',
                      variant: 'warning',
                    });
                    if (ok) {
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
                              onClick={async () => {
                                const ok = await showConfirmModal({
                                  title: 'Xóa đề thi',
                                  message: `Bạn có chắc muốn xóa đề thi "${ex.title}" (${ex.provider} ${ex.level})?`,
                                  confirmText: 'Xóa đề thi',
                                  variant: 'danger',
                                });
                                if (ok) {
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
                  onClick={async () => {
                    const ok = await showConfirmModal({
                      title: 'Khôi phục ngữ pháp gốc',
                      message: 'Khôi phục danh sách 100 chủ đề ngữ pháp gốc của hệ thống? Toàn bộ các chủ đề đã ẩn hoặc chỉnh sửa sẽ được đặt lại.',
                      confirmText: 'Khôi phục ngữ pháp',
                      variant: 'warning',
                    });
                    if (ok) {
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
                              onClick={async () => {
                                const ok = await showConfirmModal({
                                  title: 'Xóa chủ điểm ngữ pháp',
                                  message: `Bạn có chắc muốn xóa chủ điểm ngữ pháp "${g.title_vi}"?`,
                                  confirmText: 'Xóa chủ điểm',
                                  variant: 'danger',
                                });
                                if (ok) {
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
                  onClick={async () => {
                    const ok = await showConfirmModal({
                      title: 'Khôi phục danh sách video',
                      message: 'Khôi phục danh sách bộ video luyện nghe Nicos Weg gốc của hệ thống?',
                      confirmText: 'Khôi phục video',
                      variant: 'warning',
                    });
                    if (ok) {
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
                                onClick={async () => {
                                  const ok = await showConfirmModal({
                                    title: 'Xóa bộ video',
                                    message: `Xóa bộ video "${col.title}" cùng toàn bộ các tập con?`,
                                    confirmText: 'Xóa bộ video',
                                    variant: 'danger',
                                  });
                                  if (ok) {
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
                  onClick={async () => {
                    const ok = await showConfirmModal({
                      title: 'Khôi phục tình huống giao tiếp',
                      message: 'Khôi phục danh sách các tình huống giao tiếp gốc của hệ thống?',
                      confirmText: 'Khôi phục tình huống gốc',
                      variant: 'warning',
                    });
                    if (ok) {
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
                              onClick={async () => {
                                const ok = await showConfirmModal({
                                  title: 'Xóa tình huống giao tiếp',
                                  message: `Bạn có chắc muốn xóa tình huống "${s.title_vi}"?`,
                                  confirmText: 'Xóa tình huống',
                                  variant: 'danger',
                                });
                                if (ok) {
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
                    onClick={async () => {
                      const ok = await showConfirmModal({
                        title: 'Xóa toàn bộ thẻ từ vựng',
                        message: `Xóa toàn bộ ${vocabCards.length} thẻ từ vựng trong hệ thống? Thao tác này không thể hoàn tác.`,
                        confirmText: 'Xóa toàn bộ thẻ từ vựng',
                        variant: 'danger',
                      });
                      if (ok) {
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
                  { id: 'sans', preview: "'Inter', sans-serif", label: 'Hiện đại & Trực quan (Inter Sans — Chuẩn an toàn, rõ nét)', desc: 'Gọn gàng, dễ nhìn, chống mỏi mắt trên cả máy tính & điện thoại.' },
                  { id: 'serif', preview: "'Cormorant Garamond', Georgia, serif", body: "'Lora', Georgia, serif", label: 'Ấn phẩm Đức cổ điển (Cormorant Garamond + Lora)', desc: 'Phong cách trang báo hàn lâm, cổ điển.' },
                  { id: 'mono', preview: "'JetBrains Mono', monospace", label: 'Học thuật Kỹ thuật (JetBrains Mono)', desc: 'Phù hợp người thích số liệu, thẻ từ sắc nét.' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSaveUIVoice({ fontFamily: f.id })}
                    aria-pressed={uiVoice.fontFamily === f.id}
                    className={`tap w-full p-3 rounded-sm border text-left transition-all ${
                      uiVoice.fontFamily === f.id
                        ? 'border-accent bg-accent/10 ring-1 ring-accent'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div style={{ fontFamily: f.preview }} className="font-display font-bold text-sm text-foreground">
                      {f.label}
                    </div>
                    <div style={{ fontFamily: f.body || f.preview }} className="text-xs font-body text-muted-foreground mt-0.5">
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
      {/* Dynamic Model Catalog Modal */}
      <ModelCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        providerName={
          AI_PROVIDERS.find((p) => p.id === activeCatalogProvider)?.name || activeCatalogProvider.toUpperCase()
        }
        providerId={activeCatalogProvider}
        models={activeCatalogModels}
        currentModelId={activeCatalogConfig ? activeCatalogConfig.model : selectedModel}
        backupModelId={activeCatalogConfig ? activeCatalogConfig.backupModel : backupModel}
        onSelectPrimary={handleSelectPrimaryFromModal}
        onSelectBackup={handleSelectBackupFromModal}
        lastSyncedAt={discoveryMeta?.syncedAt}
      />
    </div>
  );
}
export default AdminPage;
