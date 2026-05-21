# Estructura Modular: Historia Clínica

## 📊 Resumen de Refactorización

**Antes:** 1 archivo monolítico de 389 líneas  
**Después:** 1 archivo principal de 92 líneas + 7 componentes modulares

---

## 📁 Estructura de Archivos

### Archivo Principal
```
apps/web/src/app/pacientes/[id]/historia/page.tsx (92 líneas)
└── HistoriaContent() - Componente contenedor con lógica de estado
    └── HistoriaClinicaPage() - Wrapper con ProtectedRoute y Layout
```

### Componentes Modulares
```
apps/web/src/components/historia/
├── PatientHeader.tsx          - Header con datos del paciente y botones de acción
├── ClinicalEvolutionTimeline.tsx  - Timeline vertical de consultas registradas
├── ConsultaDetail.tsx        - Vista detallada de una consulta seleccionada
├── SignosVitalesGrid.tsx     - Grid de signos vitales (reutilizable)
├── PrescriptionsPanel.tsx    - Panel lateral de recetas médicas
├── AttachmentsPanel.tsx      - Panel de documentos adjuntos
└── EmptyState.tsx            - Estado vacío cuando no hay consultas
```

---

## 🎯 Principios Aplicados

### 1. **Responsabilidad Única (Single Responsibility)**
Cada componente tiene una sola responsabilidad clara:
- `PatientHeader` → Solo maneja la presentación del header del paciente
- `ClinicalEvolutionTimeline` → Solo maneja la lista de consultas
- `ConsultaDetail` → Solo muestra el detalle de una consulta

### 2. **Separación de Concerns**
- **UI**: Componentes de presentación en `/components/historia/`
- **Lógica de datos**: Custom hook `useHistoriaClinica`
- **Utilidades**: Funciones puras en `/lib/utils/`
- **Tipos**: Interfaces en `/types/historia.ts`

### 3. **Reutilización**
Componentes diseñados para ser reutilizables:
```tsx
// SignosVitalesGrid se usa en:
- ConsultaDetail.tsx (vista de lectura)
- SignosVitalesInputs.tsx (formulario de entrada)
```

### 4. **Props Tipadas**
Todos los componentes tienen interfaces explícitas:
```typescript
interface PatientHeaderProps {
  historia: HistoriaClinica;
  pacienteId: string;
}
```

---

## 🔄 Flujo de Datos

```
HistoriaContent (Estado central)
      ↓
      ├─→ useHistoriaClinica() ← Fetch data del API
      ├─→ useState(selectedConsulta) ← Estado local
      ↓
      ├─→ PatientHeader (historia, pacienteId)
      ├─→ ClinicalEvolutionTimeline (consultas[], selectedId, onSelect)
      ├─→ ConsultaDetail (consulta)
      │     └─→ SignosVitalesGrid (signosVitales)
      ├─→ PrescriptionsPanel (recetas[])
      └─→ AttachmentsPanel (documentos[])
```

---

## 📐 Layout (3 Columnas)

```
┌─────────────────────────────────────────────────────────────┐
│                     PatientHeader                           │
├──────────────┬──────────────────────────┬───────────────────┤
│   Timeline   │    ConsultaDetail        │  Prescriptions    │
│   (25%)      │       (50%)              │     (25%)         │
│              │                          │                   │
│  • Consulta1 │  Motivo: Dolor abdominal │  Recetas activas  │
│  • Consulta2 │  Diagnóstico: ...        │                   │
│  • Consulta3 │  Tratamiento: ...        │  ───────────────  │
│              │  Signos vitales          │                   │
│              │                          │   Documentos      │
│              │                          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

---

## ✅ Ventajas del Refactor

1. **Mantenibilidad**: Cambios aislados en componentes específicos
2. **Testabilidad**: Cada componente se puede probar independientemente
3. **Escalabilidad**: Fácil agregar nuevos componentes o features
4. **Legibilidad**: Código más claro y fácil de entender
5. **Reutilización**: Componentes pueden usarse en otras partes de la app
6. **Performance**: Optimizaciones futuras más sencillas (React.memo, etc.)

---

## 🚀 Próximos Pasos Recomendados

1. **Optimización de renders**: Agregar `React.memo()` a componentes puros
2. **Tests unitarios**: Crear tests para cada componente
3. **Storybook**: Documentar componentes visualmente
4. **Lazy loading**: Cargar componentes bajo demanda
5. **Error boundaries**: Manejo de errores por componente

---

## 📝 Ejemplo de Uso

```tsx
// Antes: Todo mezclado en un archivo
function HistoriaPage() {
  // 389 líneas de código mezclado
  // UI + lógica + estilos + tipos todo junto
}

// Después: Limpio y organizado
function HistoriaContent() {
  const { historia } = useHistoriaClinica(id);
  
  return (
    <div>
      <PatientHeader {...props} />
      <Timeline {...props} />
      <Detail {...props} />
      <Sidebar {...props} />
    </div>
  );
}
```

---

**Fecha de refactorización:** Mayo 2026  
**Reducción de complejidad:** 76% (389 → 92 líneas en archivo principal)
