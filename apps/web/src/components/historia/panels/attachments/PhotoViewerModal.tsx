import Image from 'next/image';
import { Documento } from '@/types/historia';
import { useState } from 'react';
import { formatAttachmentDate, getAttachmentFileUrl } from './attachments.utils';

interface DragState {
  dragging: boolean;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

interface PhotoViewerModalProps {
  foto: Documento;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (documentoId: string) => void;
}

const initialDragState: DragState = {
  dragging: false,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0,
};

export function PhotoViewerModal({ foto, isOpen, onClose, onDelete }: PhotoViewerModalProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>(initialDragState);

  const resetViewer = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragState(initialDragState);
  };

  const handleClose = () => {
    setShowMenu(false);
    resetViewer();
    onClose();
  };

  const clampZoom = (value: number) => Math.min(4, Math.max(1, value));

  const updateZoom = (nextZoom: number) => {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);

    if (clamped === 1) {
      setPan({ x: 0, y: 0 });
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/82 backdrop-blur-[2px]" onClick={handleClose}>
      <div className="relative h-full w-full" onClick={(event) => event.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 bg-gradient-to-b from-black/55 via-black/25 to-transparent px-5 py-5 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{foto.nombre}</p>
            <p className="mt-1 text-xs text-white/80">{formatAttachmentDate(foto.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((current) => !current)}
                className="rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                aria-label="Opciones de imagen"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-12 min-w-[140px] overflow-hidden rounded-xl border border-sand-soft bg-white text-concreto shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onClose();
                      onDelete(foto.id);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              aria-label="Cerrar imagen"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`relative h-full w-full overflow-hidden ${zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${dragState.dragging ? 'cursor-grabbing' : ''}`}
          onWheel={(event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -0.2 : 0.2;
            updateZoom(zoom + delta);
          }}
          onDoubleClick={() => {
            updateZoom(zoom > 1 ? 1 : 2);
          }}
          onMouseDown={(event) => {
            if (zoom <= 1) {
              return;
            }

            event.preventDefault();
            setDragState({
              dragging: true,
              startX: event.clientX,
              startY: event.clientY,
              originX: pan.x,
              originY: pan.y,
            });
          }}
          onMouseMove={(event) => {
            if (!dragState.dragging) {
              return;
            }

            const deltaX = event.clientX - dragState.startX;
            const deltaY = event.clientY - dragState.startY;
            setPan({
              x: dragState.originX + deltaX,
              y: dragState.originY + deltaY,
            });
          }}
          onMouseUp={() => {
            if (!dragState.dragging) {
              return;
            }

            setDragState((current) => ({ ...current, dragging: false }));
          }}
          onMouseLeave={() => {
            if (!dragState.dragging) {
              return;
            }

            setDragState((current) => ({ ...current, dragging: false }));
          }}
        >
          <div
            className="relative h-full w-full transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <Image
              src={getAttachmentFileUrl(foto.url)}
              alt={foto.nombre}
              fill
              className="object-contain"
              unoptimized
              priority
              loading="eager"
              draggable={false}
            />
          </div>

          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-xs text-white backdrop-blur-sm">
            <button
              type="button"
              onClick={() => updateZoom(zoom - 0.2)}
              className="rounded-full bg-white/10 px-2 py-1 transition-colors hover:bg-white/20"
            >
              -
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => updateZoom(zoom + 0.2)}
              className="rounded-full bg-white/10 px-2 py-1 transition-colors hover:bg-white/20"
            >
              +
            </button>
            <button
              type="button"
              onClick={resetViewer}
              className="rounded-full bg-white/10 px-2 py-1 transition-colors hover:bg-white/20"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}