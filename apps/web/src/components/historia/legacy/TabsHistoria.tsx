import { TabType } from '@/types/historia';

interface TabsHistoriaProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  consultasCount: number;
  recetasCount: number;
  documentosCount: number;
}

export function TabsHistoria({
  activeTab,
  onTabChange,
  consultasCount,
  recetasCount,
  documentosCount,
}: TabsHistoriaProps) {
  const tabs = [
    { key: 'consultas' as TabType, label: 'Consultas', count: consultasCount },
    { key: 'recetas' as TabType, label: 'Recetas', count: recetasCount },
    { key: 'documentos' as TabType, label: 'Documentos', count: documentosCount },
    { key: 'resumen' as TabType, label: 'Resumen', count: null },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.key
                ? 'border-morena text-morena'
                : 'border-transparent text-marengo hover:text-concreto'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-2 px-2 py-0.5 bg-piel/30 text-xs rounded-lg">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
