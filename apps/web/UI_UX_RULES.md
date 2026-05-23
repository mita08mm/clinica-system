# Reglas UI/UX

`historia` es la referencia visual actual del proyecto. Estas reglas deben aplicarse antes de abrir nuevas variantes o estilos ad hoc.

## 1. Sistema base

- Usar primero `components/ui/*` para botones, badges, cards, inputs, selects y textareas.
- Si un caso no existe en `components/ui/*`, se agrega al sistema; no se resuelve con estilos aislados dentro de una pantalla.
- `globals.css` define tokens y clases compartidas. No mezclar nuevos patrones visuales si ya existe una clase equivalente.

## 2. Jerarquia visual

- Cada vista debe tener una accion principal clara y una sola CTA dominante.
- Los encabezados muestran contexto rapido, no bloques grandes de texto.
- La informacion secundaria debe vivir en badges, labels compactos o metadatos de una linea.

## 3. Contenido clinico

- Todo texto visible debe estar en espanol y con el mismo tono del dominio clinico.
- Evitar controles decorativos sin comportamiento real.
- Si no existe una accion funcional, no debe renderizarse un boton solo para “verse completo”.
- Los estados vacios deben indicar que falta y cual es la siguiente accion real.

## 4. Layout

- Formularios: ancho maximo controlado con `.form-container` y campos limitados cuando aplique.
- Tarjetas: borde sutil, padding consistente y separacion clara entre encabezado y contenido.
- Lists/timelines: priorizar lectura vertical, metadatos compactos y bloques expandibles solo si aportan informacion.

## 5. Densidad y espaciado

- Evitar heroes altos, dobles barras de acciones o headers con ruido.
- Reducir separators visuales a lo necesario: borde suave, badges y tipografia hacen la mayor parte del trabajo.
- No usar mas de un estilo de radio, sombra o peso visual para resolver el mismo problema.

## 6. Referencia actual

- Bueno como referencia: `components/historia/header/PatientHeader.tsx` por su resumen rapido.
- Bueno como referencia: `components/historia/timeline/TratamientosList.tsx` por jerarquia, idioma y uso de atoms.
- Si una nueva pantalla rompe estas reglas, primero se corrige la estructura antes de agregar mas UI.