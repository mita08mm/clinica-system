import Image from "next/image";
import { Documento } from "@/types/historia";
import { getAttachmentFileUrl } from "./attachments.utils";

interface AttachmentsPhotoTabProps {
  fotos: Documento[];
  isUploading: boolean;
  onOpenPhoto: (fotoId: string) => void;
  onTriggerUpload: () => void;
  previewFotoId?: string | null;
}

export function AttachmentsPhotoTab({
  fotos,
  isUploading,
  onOpenPhoto,
  onTriggerUpload,
  previewFotoId,
}: AttachmentsPhotoTabProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {fotos.map((foto) => (
        <button
          key={foto.id}
          type="button"
          onClick={() => onOpenPhoto(foto.id)}
          className={`group relative overflow-hidden rounded-2xl border bg-surface-muted text-left shadow-sm outline-none transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:outline-none ${previewFotoId === foto.id ? "border-morena ring-1 ring-morena/20" : "border-sand-soft hover:border-morena/40"}`}
        >
          <div className="relative aspect-[4/5] bg-white">
            <Image
              src={getAttachmentFileUrl(foto.url)}
              alt={foto.nombre}
              fill
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-3 opacity-0 transition-all duration-200 group-hover:opacity-100">
              <span className="max-w-[70%] truncate text-xs font-medium text-white drop-shadow-sm">
                {foto.nombre}
              </span>
              <span className="rounded-full bg-black/35 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                Ver
              </span>
            </div>
          </div>
        </button>
      ))}

      <button
        type="button"
        disabled={isUploading}
        onClick={onTriggerUpload}
        className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sand bg-surface-muted px-3 py-3 text-center transition-colors hover:bg-[#f8f4ef] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-piel-soft text-morena">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </span>
        <span className="mt-3 text-sm font-medium text-concreto">
          {isUploading ? "Subiendo..." : "Subir imagen"}
        </span>
        <span className="mt-1 text-xs text-marengo">JPG, PNG</span>
      </button>
    </div>
  );
}
