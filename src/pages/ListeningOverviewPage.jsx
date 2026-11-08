import {ListeningLibraryBrowser} from '@/components/skills/ListeningLibraryBrowser';
import {digest} from '@/core/elio/passwords';
import {CreateCollectionDialog} from '@/components/common/CollectionTools';
import {elioClient} from '@/lib/elio-auth-runtime';
import {ImportedContentManager} from '@/components/common/ImportedContentManager';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/db';
import {elioImport} from '@/lib/elio-import-runtime';
import {listeningCoreActive,elioListening} from '@/lib/elio-listening-runtime';
import { useRouter, Link } from '@/lib/router';
import { PageHeader } from '@/components/ui/PageHeader';
import { UniversalImportModal } from '@/components/common/UniversalImportModal';
import { LEVEL_IDS } from '@/data/levels';
import { toast } from 'sonner';
import { showConfirmModal } from '@/components/ui/ConfirmModal';
import {
  Headphones,
  Plus,
  PlayCircle,
  Youtube,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  Globe,
  Lock,
  User,
  Video,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';

export function ListeningOverviewPage({ initialTab = null }) {
  const { navigate,search,currentPath } = useRouter();
  const listenParams=new URLSearchParams(search);
  const mode=listenParams.get('listenMode');
  const setMode=value=>{const next=new URLSearchParams(search);next.set('listenMode',value);next.delete('listenGroup');next.delete('listenLevel');next.delete('listenSearch');navigate(currentPath+'?'+next.toString());};
    const [managing,setManaging]=useState(false),[creatingGroup,setCreatingGroup]=useState(false),[importTarget,setImportTarget]=useState(null),[groupBusy,setGroupBusy]=useState(false);
  const selectedLevel='ALL'; const setSelectedLevel=()=>{};
  const [activeScopeTab, setActiveScopeTab] = useState(() => {
    if (initialTab) return initialTab;
    if (typeof window !== 'undefined' && (window.location.hash.includes('personal') || window.location.pathname.includes('personal'))) {
      return 'personal';
    }
    return 'all';
  });
  const [collections, setCollections] = useState(() => db.listening.getCollections());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  const currentUser = db.auth.getUser();
  const isAdmin = db.auth.isAdmin();

  useEffect(() => {
    const handleDbChange = () => {
      setCollections(db.listening.getCollections());
    };
    window.addEventListener('sprach_db_change', handleDbChange);
    return () => window.removeEventListener('sprach_db_change', handleDbChange);
  }, [selectedLevel]);

  const filteredCollections = collections.filter((c) => {
    if(mode==='podcast'&&!/podcast|podcast|postcard/i.test([c.title,c.provider,c.description].join(' ')))return false;
    // 1. Level filter
    if (selectedLevel !== 'ALL' && !(c.levels||[c.level]).includes(selectedLevel)) return false;

    // 2. Scope tab filter
    if (activeScopeTab === 'personal') {
      return c.scope === 'private' || c.id === 'my-personal-videos' || c.created_by === currentUser?.id;
    } else {
      // Kho chung
      return c.scope === 'public' || (!c.scope && c.id !== 'my-personal-videos');
    }
  });

  const allEpisodes=useMemo(()=>collections.flatMap(collection=>db.listening.getEpisodes(collection.id).map(episode=>({...episode,collection}))),[collections]);
  const studioModes=[{id:'quiz',title:'Bài nghe & Quiz',description:'Nghe, hiểu và trả lời câu hỏi',icon:Headphones,count:allEpisodes.filter(e=>e.quiz?.length||e.questions?.length).length},{id:'youtube',title:'YouTube',description:'Dán link, học với phụ đề',icon:Youtube,count:allEpisodes.filter(e=>e.youtubeId).length},{id:'podcast',title:'Podcast',description:'Các tập nghe do bạn hoặc Admin thêm',icon:Headphones,count:allEpisodes.filter(e=>/podcast|postcard/i.test([e.collection.title,e.collection.provider].join(' '))).length},{id:'dictation',title:'Chép chính tả',description:'Nghe từng câu, gõ và đối chiếu',icon:Edit3,count:allEpisodes.filter(e=>e.subtitles?.length).length},{id:'shadowing',title:'Shadowing',description:'Nghe mẫu, ghi âm và nghe lại',icon:Video,count:allEpisodes.length}];
  const handleDeleteCollection = async (colId, colTitle) => {
    const ok = await showConfirmModal({
      title: 'Xóa bộ video',
      message: `Bạn có chắc chắn muốn xóa bộ video "${colTitle}" cùng toàn bộ các tập con không?`,
      confirmText: 'Xóa bộ video',
      variant: 'danger',
    });
    if (ok) {
      try{await db.listening.deleteCollection(colId);toast.success(`Đã xóa bộ video: "${colTitle}"`);}catch(error){toast.error(error.message);}
    }
  };

  const handleResetListening = async () => {
    if(listeningCoreActive())return toast.error('Thao tác này chưa nối server; dữ liệu hiện tại được giữ nguyên.');
    const ok = await showConfirmModal({
      title: 'Khôi phục video luyện nghe',
      message: 'Khôi phục lại toàn bộ các bộ video luyện nghe gốc chuẩn Nicos Weg của hệ thống?',
      confirmText: 'Khôi phục gốc',
      variant: 'warning',
    });
    if (ok) {
      db.listening.resetDefaults();
      toast.success('Đã khôi phục các bộ video gốc!');
    }
  };

  async function ensureGroupFolder(group,name=group.title){
    if(group.organizerId)return {id:group.organizerId,revision:group.revision};
    const result=await elioClient.createCollection({name,skill:'listening',visibility:group.scope==='private'?'private':'public',requestId:'listening-group-'+await digest(group.id)});
    for(const recordId of group.recordIds||[])await elioClient.moveCollectionRecord({recordId,collectionId:result.collection.id});
    return result.collection;
  }
  const addToGroup=async group=>{if(groupBusy)return;setGroupBusy(true);try{const folder=await ensureGroupFolder(group);setImportTarget(folder.id);setIsImportOpen(true);}catch(error){toast.error(error.message);}finally{setGroupBusy(false);await elioListening()?.hydrate().catch(error=>toast.error(error.message));}};
  const handleSaveCollectionEdit = async(e) => {
    e.preventDefault();if(!editingCollection||groupBusy)return;setGroupBusy(true);
    try{
     if(listeningCoreActive()){
      const original=collections.find(c=>c.id===editingCollection.id);const folder=await ensureGroupFolder(original,original.title);
      await elioClient.renameCollection({id:folder.id,revision:folder.revision,name:editingCollection.title});
      await elioListening().hydrate();
     }else db.listening.updateCollection(editingCollection.id,{...editingCollection});
     setEditingCollection(null);toast.success('Đã đổi tên bộ nghe.');
    }catch(error){toast.error(error.message);}finally{setGroupBusy(false);}
  };

  return (
    <div className="space-y-6 animate-rise">
      <PageHeader
        eyebrow="PHÒNG KỸ NĂNG NGÔN NGỮ"
        title="Luyện nghe tiếng Đức"
        deTitle="Hörverstehen & Video-Studio"
        subtitle="Học qua video YouTube có phụ đề song ngữ Đức - Việt, đồng bộ thời gian thực theo lời nói, tự động dừng từng câu và chép chính tả chuẩn CEFR."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={()=>setCreatingGroup(true)} className="tap px-3 py-1.5 border border-border bg-card rounded-sm font-heading text-sm">Tạo bộ nghe</button>
            {isAdmin && (
              <button
                onClick={handleResetListening}
                className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-muted-foreground font-mono text-xs flex items-center gap-1.5 shadow-sm"
                title="Khôi phục danh sách video gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Khôi phục gốc</span>
              </button>
            )}
            {activeScopeTab === 'personal' ? (
              <button
                onClick={() => listeningCoreActive()&&!elioImport.isActive()?toast.error('Import video chưa nối server; chưa ghi dữ liệu cục bộ.'):setIsImportOpen(true)}
                className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
                title="Dán link video YouTube vào kho cá nhân của bạn"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm video cá nhân</span>
              </button>
            ) : (
              <button
                onClick={() => listeningCoreActive()&&!elioImport.isActive()?toast.error('Import video chưa nối server; chưa ghi dữ liệu cục bộ.'):setIsImportOpen(true)}
                className="tap px-3.5 py-1.5 rounded-sm bg-accent hover:bg-accent/90 text-accent-foreground font-mono text-xs font-semibold shadow-sm flex items-center gap-1.5"
                title="Import video YouTube vào kho chung"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdmin ? 'Import Video vào Kho chung (Publish)' : '+ Đóng góp Video'}</span>
              </button>
            )}
          </div>
        }
      />

      <section aria-label="Chế độ luyện nghe" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">{studioModes.map(item=>{const Icon=item.icon;return <button key={item.id} onClick={()=>item.id==='quiz'?navigate('/practice?skill=listening'):setMode(item.id)} className={'surface rounded-2xl border p-5 text-left min-h-44 flex flex-col gap-4 '+(mode===item.id?'border-accent':'border-border')}><Icon className="w-6 h-6 text-accent"/><div className="space-y-2"><h2 className="font-heading text-lg font-semibold">{item.title}</h2><p className="font-body text-sm text-muted-foreground leading-relaxed">{item.description} · {item.count} video</p></div></button>;})}</section>
      {/* Scope Navigation Tabs: Kho Chung vs Video Cá Nhân */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScopeTab('all')}
            className={`tap px-4 py-2 rounded-sm text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeScopeTab === 'all'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Kho video chung toàn hệ thống</span>
          </button>

          <button
            onClick={() => setActiveScopeTab('personal')}
            className={`tap px-4 py-2 rounded-sm text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeScopeTab === 'personal'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Video cá nhân của tôi (My Videos)</span>
          </button>
        </div>

        {activeScopeTab === 'personal' && (
          <button
            onClick={() => listeningCoreActive()&&!elioImport.isActive()?toast.error('Import video chưa nối server; chưa ghi dữ liệu cục bộ.'):setIsImportOpen(true)}
            className="tap px-3 py-1.5 rounded bg-accent/10 border border-accent/30 text-accent text-xs font-mono font-bold hover:bg-accent/20 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Bỏ video cá nhân vào đây</span>
          </button>
        )}
      </div>

      {mode&&<ListeningLibraryBrowser collections={filteredCollections} mode={mode} onAdd={addToGroup} onEdit={col=>setEditingCollection({...col})} canManage={col=>isAdmin||col.created_by===currentUser?.id}/>}
      <CreateCollectionDialog open={creatingGroup} onClose={()=>setCreatingGroup(false)} initialSkill="listening" onCreated={async folder=>{setCreatingGroup(false);setSelectedLevel('ALL');setActiveScopeTab(folder.visibility==='private'?'personal':'all');await elioListening()?.hydrate();navigate(currentPath+'?listenMode=youtube&listenGroup='+encodeURIComponent('folder-'+folder.id));toast.success('Đã tạo bộ nghe riêng. Chọn Thêm video vào bộ này.');}}/>
      {managing&&<ImportedContentManager onClose={()=>setManaging(false)}/>}
      {/* Universal Import Modal */}
      <UniversalImportModal
        isOpen={isImportOpen}
        onClose={() => {setIsImportOpen(false);setImportTarget(null);}}
        defaultType="listening"
        defaultCollectionId={importTarget}
        initialScope={activeScopeTab === 'personal' ? 'private' : 'public'}
        onSuccess={() => {
          setCollections(db.listening.getCollections());
        }}
      />

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="surface p-6 max-w-md w-full space-y-4 rounded-sm border border-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                Chỉnh sửa bộ video luyện nghe
              </h3>
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="tap p-1.5 rounded-sm hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCollectionEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên bộ (Tiếng Việt) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollection.title || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              {!listeningCoreActive()&&<>
              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Tên bộ (Tiếng Đức)
                </label>
                <input
                  type="text"
                  value={editingCollection.deTitle || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, deTitle: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Cấp độ (CEFR) *
                  </label>
                  <select
                    value={editingCollection.level || 'B1'}
                    onChange={(e) => setEditingCollection({ ...editingCollection, level: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  >
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Nguồn / Kênh cung cấp
                  </label>
                  <input
                    type="text"
                    value={editingCollection.provider || ''}
                    onChange={(e) => setEditingCollection({ ...editingCollection, provider: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-1">
                  <label className="font-mono text-muted-foreground uppercase text-[10px]">
                    Phạm vi (Scope)
                  </label>
                  <select
                    value={editingCollection.scope || 'public'}
                    onChange={(e) => setEditingCollection({ ...editingCollection, scope: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                  >
                    <option value="public">🌍 Toàn hệ thống (Public)</option>
                    <option value="private">👤 Cá nhân (Private)</option>
                    <option value="admin_only">🔒 Nội bộ Admin</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-mono text-muted-foreground uppercase text-[10px]">
                  Mô tả bộ video
                </label>
                <textarea
                  rows={3}
                  value={editingCollection.description || ''}
                  onChange={(e) => setEditingCollection({ ...editingCollection, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-sm border border-border bg-card text-foreground"
                />
              </div>

              </>}
              {listeningCoreActive()&&<p className="font-body text-sm text-muted-foreground">Tên áp dụng cho cả bộ. Cấp độ và nội dung được giữ theo từng video; chỉnh từng tài liệu ở Sửa / Xóa nội dung import.</p>}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingCollection(null)}
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

export default ListeningOverviewPage;
