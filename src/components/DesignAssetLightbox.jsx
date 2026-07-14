import React, { useMemo } from 'react';
import clsx from 'clsx';

const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/i;
const VIMEO_REGEX = /vimeo\.com\/(\d+)/i;

const buildEmbedUrl = (url) => {
  if (!url) {
    return null;
  }
  const youtubeMatch = YOUTUBE_REGEX.exec(url);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
  }
  const vimeoMatch = VIMEO_REGEX.exec(url);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
};

const DesignAssetLightbox = ({
  open,
  project,
  asset,
  onClose,
  onPrevAsset,
  onNextAsset,
  onPrevProject,
  onNextProject,
  hasPrevAsset,
  hasNextAsset,
  hasPrevProject,
  hasNextProject,
  canDelete,
  onDelete,
}) => {
  const embedUrl = useMemo(() => buildEmbedUrl(asset?.video_url), [asset?.video_url]);

  if (!open || !asset || !project) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          Close
        </button>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{project.name}</p>
              <h3 className="text-lg font-semibold text-slate-900">{asset.title}</h3>
              {asset.description ? <p className="text-sm text-slate-500">{asset.description}</p> : null}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={onPrevProject}
                disabled={!hasPrevProject}
                className={clsx(
                  'rounded-pill px-3 py-1 font-semibold transition',
                  hasPrevProject ? 'bg-slate-100 hover:bg-slate-200' : 'cursor-not-allowed bg-slate-100/60',
                )}
              >
                {'<'} Prev project
              </button>
              <button
                type="button"
                onClick={onNextProject}
                disabled={!hasNextProject}
                className={clsx(
                  'rounded-pill px-3 py-1 font-semibold transition',
                  hasNextProject ? 'bg-slate-100 hover:bg-slate-200' : 'cursor-not-allowed bg-slate-100/60',
                )}
              >
                Next project {'>'}
              </button>
            </div>
          </div>

          <div className="relative flex min-h-[320px] items-center justify-center rounded-2xl bg-slate-50">
            <button
              type="button"
              onClick={onPrevAsset}
              disabled={!hasPrevAsset}
              className={clsx(
                'absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow transition',
                hasPrevAsset ? 'hover:bg-white' : 'cursor-not-allowed opacity-40',
              )}
            >
              {'<'}
            </button>

            {asset.media_type === 'image' && asset.image ? (
              <img src={asset.image} alt={asset.title} className="max-h-[480px] w-full rounded-2xl object-contain" />
            ) : null}

            {asset.media_type === 'video' ? (
              embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={asset.title}
                  className="h-[320px] w-full rounded-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-[320px] w-full flex-col items-center justify-center gap-3 rounded-2xl bg-slate-900 text-white">
                  <p className="text-sm font-semibold">Unable to embed this video.</p>
                  {asset.video_url ? (
                    <a
                      href={asset.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                    >
                      Open video in new tab
                    </a>
                  ) : null}
                </div>
              )
            ) : null}

            <button
              type="button"
              onClick={onNextAsset}
              disabled={!hasNextAsset}
              className={clsx(
                'absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow transition',
                hasNextAsset ? 'hover:bg-white' : 'cursor-not-allowed opacity-40',
              )}
            >
              {'>'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{asset.media_type === 'video' ? 'Video embed' : 'Image asset'}</span>
            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-pill bg-rose-500/10 px-3 py-1 font-semibold text-rose-600 transition hover:bg-rose-500/20"
              >
                Delete asset
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignAssetLightbox;
