import { Documento } from "@/types/historia";
import {
  formatAttachmentDate,
  formatAttachmentSize,
  getAttachmentFileUrl,
} from "./attachments.utils";

interface AttachmentsDocumentsTabProps {
  documentos: Documento[];
  isUploading: boolean;
  onDelete: (documentoId: string) => void;
  onToggleMenu: (documentoId: string) => void;
  onTriggerUpload: () => void;
  openMenuId: string | null;
}

export function AttachmentsDocumentsTab({
  documentos,
  isUploading,
  onDelete,
  onToggleMenu,
  onTriggerUpload,
  openMenuId,
}: AttachmentsDocumentsTabProps) {
  return (
    <div className="space-y-3">
      {documentos.map((doc) => (
        <div
          key={doc.id}
          className="group flex items-center gap-3 rounded-2xl border border-sand-soft bg-surface-muted px-4 py-3 transition-colors hover:bg-[#f8f4ef]"
        >
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-morena shadow-sm">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.7}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </span>
          <a
            href={getAttachmentFileUrl(doc.url)}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1"
          >
            <span className="block truncate text-sm font-medium text-concreto hover:text-morena">
              {doc.nombre}
            </span>
            <p className="mt-1 text-xs text-marengo">
              {formatAttachmentSize(doc.tamaño)} •{" "}
              {formatAttachmentDate(doc.createdAt)}
            </p>
          </a>
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMenu(doc.id)}
              className="rounded-full bg-white/80 p-2 text-marengo transition-colors hover:bg-white hover:text-concreto"
              aria-label="Opciones del documento"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5zm0 6a.75.75 0 110-1.5.75.75 0 010 1.5z"
                />
              </svg>
            </button>
            {openMenuId === doc.id && (
              <div className="absolute right-0 top-12 z-10 min-w-[150px] overflow-hidden rounded-xl border border-sand-soft bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => onDelete(doc.id)}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
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
          {isUploading ? "Subiendo..." : "Subir documento"}
        </span>
        <span className="mt-1 text-xs text-marengo">PDF, DOC</span>
      </button>
    </div>
  );
}
