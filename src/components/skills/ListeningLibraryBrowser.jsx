import React, { useMemo } from 'react';
import { useRouter } from '@/lib/router';
import { db } from '@/lib/db';
import {
  listeningNavigationGroups,
  listeningModeMatches,
  listeningLevels,
  filterListeningEpisodes,
} from '@/lib/listening-navigation';
import { Edit3, Trash2, Plus } from 'lucide-react';

const button = 'tap px-3 py-2 border border-border bg-card rounded-sm font-heading text-sm';

export function ListeningLibraryBrowser({
  collections,
  mode,
  onAdd,
  onEdit,
  onDelete,
  canManage,
}) {
  const { search, currentPath, navigate } = useRouter();
  const params = new URLSearchParams(search);
  const groupId = params.get('listenGroup');
  const level = params.get('listenLevel');
  const query = params.get('listenSearch') || '';
  const catalogLevel = params.get('listenCatalogLevel') || 'ALL';

  const go = (values) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(values)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    navigate(currentPath + '?' + next.toString(), {
      replace: Object.hasOwn(values, 'listenSearch') && Object.keys(values).length === 1,
      scroll: !Object.hasOwn(values, 'listenSearch') || Object.keys(values).length !== 1,
    });
  };

  const groups = useMemo(
    () =>
      listeningNavigationGroups(collections, (id) => db.listening.getEpisodes(id)).filter((g) =>
        listeningModeMatches(g, mode)
      ),
    [collections, mode]
  );

  const group = groups.find((g) => g.id === groupId);
  const visibleGroups = groups.filter(
    (g) =>
      (catalogLevel === 'ALL' || g.episodes.some((e) => e.level === catalogLevel)) &&
      (!query ||
        [g.title, ...g.episodes.map((e) => e.title)]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query.toLocaleLowerCase()))
  );
  const episodes = filterListeningEpisodes(group?.episodes || [], level || 'ALL', query);
  const levels = listeningLevels(group?.episodes || []);
  const catalogLevels = listeningLevels(groups.flatMap((g) => g.episodes));
  const title =
    group?.title ||
    { youtube: 'YouTube', podcast: 'Podcast', dictation: 'Chép chính tả', shadowing: 'Shadowing' }[
      mode
    ] ||
    'Bộ nghe';

  const getManageableCol = (targetGroup) => {
    if (!targetGroup?.collections?.length) return null;
    const found = targetGroup.collections.find((c) => (canManage ? canManage(c) : true));
    return found || targetGroup.collections[0];
  };

  const groupManageableCol = group ? getManageableCol(group) : null;

  return (
    <section className="space-y-4">
      <nav aria-label="Đường dẫn bộ nghe" className="flex flex-wrap items-center gap-2 text-sm font-heading">
        <button
          className={button}
          onClick={() => go({ listenMode: null, listenGroup: null, listenLevel: null, listenSearch: null })}
        >
          Tổng quan nghe
        </button>
        <span>›</span>
        <button className={button} onClick={() => go({ listenGroup: null, listenLevel: null, listenSearch: null })}>
          {
            { youtube: 'YouTube', podcast: 'Podcast', dictation: 'Chép chính tả', shadowing: 'Shadowing' }[
              mode
            ]
          }
        </button>
        {group && (
          <>
            <span>›</span>
            <button className={button} onClick={() => go({ listenLevel: null, listenSearch: null })}>
              {group.title}
            </button>
          </>
        )}
        {level && <span>› {level === 'ALL' ? 'Tất cả cấp độ' : level}</span>}
      </nav>

      {/* Header & Thanh công cụ thao tác nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">
            {title}
            {level ? ' · ' + (level === 'ALL' ? 'Tất cả cấp độ' : level) : ''}
          </h2>
          {group && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {group.episodes.length} video trong bộ này
            </p>
          )}
        </div>

        {/* Nút Sửa / Xóa / Thêm video khi đang xem chi tiết một bộ */}
        {group && groupManageableCol && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onAdd?.(groupManageableCol)}
              className="tap px-3 py-1.5 rounded-sm bg-accent text-accent-foreground text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm"
              title="Thêm video vào bộ này"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm video</span>
            </button>
            <button
              type="button"
              onClick={() => onEdit?.(groupManageableCol)}
              className="tap px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-foreground text-xs font-mono font-bold flex items-center gap-1.5"
              title="Sửa tên / Cấp độ bộ video"
            >
              <Edit3 className="w-3.5 h-3.5 text-accent" />
              <span>Sửa bộ</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(groupManageableCol.id, group.title)}
              className="tap px-3 py-1.5 rounded-sm border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-mono font-bold flex items-center gap-1.5"
              title="Xóa vĩnh viễn bộ video này"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa bộ</span>
            </button>
          </div>
        )}
      </div>

      <label className="block space-y-2 font-heading text-sm">
        {group ? 'Tìm video trong bộ này' : 'Tìm bộ hoặc video'}
        <input
          type="search"
          aria-label="Tìm trong bộ nghe đang mở"
          value={query}
          onChange={(e) => go({ listenSearch: e.target.value || null })}
          className="block w-full bg-card border border-border rounded-sm px-3 py-2.5"
        />
      </label>

      {/* DANH SÁCH CÁC BỘ NGHE (OVERVIEW CARDS) */}
      {!groupId && (
        <>
          <label className="block font-heading text-sm">
            Lọc bộ nghe theo cấp độ
            <select
              aria-label="Lọc bộ nghe theo cấp độ"
              value={catalogLevel}
              onChange={(e) => go({ listenCatalogLevel: e.target.value })}
              className={button + ' block mt-2 min-w-40'}
            >
              <option value="ALL">Tất cả cấp độ</option>
              {catalogLevels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted-foreground">
            {visibleGroups.length} bộ ·{' '}
            {visibleGroups.reduce(
              (n, g) => n + filterListeningEpisodes(g.episodes, catalogLevel).length,
              0
            )}{' '}
            video
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleGroups.map((g) => {
              const manageableCol = getManageableCol(g);

              return (
                <section
                  key={g.id}
                  className="surface border border-border p-5 text-left space-y-3 relative group/card hover:border-accent/40 transition-colors rounded-sm flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="block text-left flex-1"
                        onClick={() =>
                          go({
                            listenGroup: g.id,
                            listenLevel: catalogLevel === 'ALL' ? null : catalogLevel,
                            listenSearch: null,
                          })
                        }
                      >
                        <h3 className="font-heading text-xl font-semibold hover:text-accent transition-colors">
                          {g.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {g.episodes.length} video
                        </p>
                      </button>

                      {/* NÚT THAO TÁC TRỰC TIẾP TRÊN THẺ CARD (SỬA & XÓA & THÊM) */}
                      {manageableCol && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdd?.(manageableCol);
                            }}
                            className="tap px-2 py-1 rounded-sm border border-border bg-card hover:bg-accent/10 hover:text-accent hover:border-accent/30 text-muted-foreground text-xs font-mono font-medium flex items-center gap-1"
                            title="Thêm video vào bộ này"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Thêm</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(manageableCol);
                            }}
                            className="tap px-2 py-1 rounded-sm border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-mono font-medium flex items-center gap-1"
                            title="Sửa tên / cấp độ bộ video"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-accent" />
                            <span className="hidden sm:inline">Sửa</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete?.(manageableCol.id, g.title);
                            }}
                            className="tap px-2 py-1 rounded-sm border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive text-xs font-mono font-medium flex items-center gap-1"
                            title="Xóa bộ video này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <nav aria-label={'Cấp độ trong bộ ' + g.title} className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                    <button
                      className={button}
                      onClick={() => go({ listenGroup: g.id, listenLevel: 'ALL', listenSearch: null })}
                    >
                      Tất cả
                    </button>
                    {listeningLevels(g.episodes).map((l) => (
                      <button
                        key={l}
                        className={button}
                        onClick={() => go({ listenGroup: g.id, listenLevel: l, listenSearch: null })}
                      >
                        {l} · {g.episodes.filter((e) => e.level === l).length}
                      </button>
                    ))}
                  </nav>
                </section>
              );
            })}
          </div>
          {!visibleGroups.length && <p>Chưa có bộ nghe khớp cấp độ và tìm kiếm đang chọn.</p>}
        </>
      )}

      {/* VIEW CHI TIẾT CỦA BỘ */}
      {group && (
        <label className="block font-heading text-sm">
          Cấp độ trong bộ {group.title}
          <select
            aria-label="Cấp độ trong bộ đang mở"
            value={level || ''}
            onChange={(e) => go({ listenLevel: e.target.value || null })}
            className={button + ' block mt-2 min-w-40'}
          >
            <option value="">Chọn cấp độ</option>
            <option value="ALL">Tất cả cấp độ · {group.episodes.length} video</option>
            {levels.map((l) => (
              <option key={l} value={l}>
                {l} · {group.episodes.filter((e) => e.level === l).length} video
              </option>
            ))}
          </select>
        </label>
      )}

      {groupId && !group && (
        <p role="status">Không tìm thấy bộ trong mục đang mở. Chọn lại bộ nghe ở đường dẫn phía trên.</p>
      )}

      {group && !level && (
        <>
          <p className="text-muted-foreground">Chọn cấp độ để xem các video bên trong bộ này.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((l) => (
              <button
                key={l}
                className="surface border border-border p-5 text-left space-y-2 hover:border-accent/40 transition-colors"
                onClick={() => go({ listenLevel: l, listenSearch: null })}
              >
                <h3 className="font-heading text-xl font-semibold">
                  {group.title} · {l}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {group.episodes.filter((e) => e.level === l).length} video
                </p>
              </button>
            ))}
          </div>
          {!levels.length && <p>Bộ chưa có video. Thêm video vào bộ bằng nút "+ Thêm video" phía trên.</p>}
        </>
      )}

      {group && level && (
        <>
          <p className="text-sm text-muted-foreground">{episodes.length} video</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {episodes.map((e) => (
              <button
                key={e.collectionId + ':' + e.id}
                className="surface border border-border overflow-hidden text-left hover:border-accent/40 transition-colors"
                onClick={() =>
                  navigate(
                    '/skills/listening/' +
                      e.collectionId +
                      '/' +
                      e.id +
                      '?mode=' +
                      (mode === 'dictation' ? 'dictation' : mode === 'shadowing' ? 'shadowing' : 'video')
                  )
                }
              >
                <img
                  alt=""
                  loading="lazy"
                  className="w-full aspect-video object-cover"
                  src={'https://img.youtube.com/vi/' + e.youtubeId + '/mqdefault.jpg'}
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-heading font-semibold line-clamp-2">{e.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {e.level} · {e.subtitles?.length || 0} câu phụ đề
                  </p>
                </div>
              </button>
            ))}
          </div>
          {!episodes.length && <p>Không có video khớp tìm kiếm trong cấp độ này.</p>}
        </>
      )}
    </section>
  );
}
