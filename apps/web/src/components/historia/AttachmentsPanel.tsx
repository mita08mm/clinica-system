import { Documento } from '@/types/historia';

interface AttachmentsPanelProps {
  documentos: Documento[];
}

export default function AttachmentsPanel({ documentos }: AttachmentsPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-concreto mb-4">Documentos Adjuntos</h2>

      <div className="space-y-3">
        {documentos.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-4xl text-marengo/30 mb-2">📎</div>
            <p className="text-sm text-marengo/60 mb-1">Arrastra archivos aquí</p>
          </div>
        ) : (
          documentos.map((doc) => (
            <div 
              key={doc.id} 
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                <span className="text-xs font-medium text-marengo">
                  {doc.tipo.includes('pdf') ? '📄' : '🖼️'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-concreto truncate">{doc.nombre}</p>
                <p className="text-xs text-marengo/60">2.5 MB</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
