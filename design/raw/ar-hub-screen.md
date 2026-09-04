# ar-hub-screen (nodeId 4:170) — solo referencia del dock de /ar

Respuesta cruda de `get_design_context`. fileKey de la copia `hxwh2tRvdUhhLhe4ciEdNq`. Frame 402×874, **oculto** en el archivo (`hidden="true"`), por eso la captura devuelta vino en blanco. Extraído 2026-09-04.

## Qué aporta (versión anterior del mismo momento que ar-combined-screen)

- Fondo viewfinder con opacity 0 (oculto).
- top-controls idénticos a ar-combined: back 40 + chip "AR HUB ACTIVE".
- bottom-sheet: 360px alto, fondo rgba(24,24,41,.82), borde superior rgba(255,255,255,.08), radios superiores 32, sombra 0 8 24 rgba(0,0,0,.5), px 24 pt 12 pb 24, gap 20.
  - sheet-handle: píldora 40×4 radio 2 color #56566b centrada.
  - mascot-info: igual que ar-combined ("TORONTO BLUE JAYS · OFFICIAL MASCOT" / "ACE THE BLUE JAY").
  - action-dock-grid: etiqueta "INTERACTION DOCK" Inter Bold 11 #9090a8; dos filas `justify-between` de 3 celdas de 100px: Animation (activo), Info, Video / Effects, Stats, Trivia. Celda: círculo 54 + etiqueta Inter Semi Bold 11, gap 6.
- Tab bar vieja con quinta pestaña "Profile" (icono user): IGNORAR, la correcta es "Game".

## Uso en la app

El estilo de esta hoja (fondo rgba(24,24,41,.82), handle #56566b, radios 32) se aplica a los paneles inferiores que abre cada botón del dock en /ar. La distribución de botones se toma de ar-combined-screen.

## Assets

| archivo | uso | URL |
|---|---|---|
| (no descargado) | viewfinder oculto, mismo tipo de imagen que viewfinder-bg | https://www.figma.com/api/mcp/asset/a539e8a5-e1af-4c1f-84b1-7a483cca4b3e.png |

## Código devuelto (React + Tailwind, referencia resumida)

```jsx
<div className="bg-[rgba(24,24,41,0.82)] border-[rgba(255,255,255,0.08)] border-t flex flex-col gap-[20px] h-[360px] pb-[24px] pt-[12px] px-[24px] rounded-tl-[32px] rounded-tr-[32px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.5)] w-full" data-node-id="4:185" data-name="bottom-sheet">
  <div className="flex justify-center w-full" data-name="sheet-handle"><div className="bg-[#56566b] h-[4px] rounded-[2px] w-[40px]" /></div>
  <div className="flex flex-col gap-[4px] w-full" data-name="mascot-info">
    <div className="flex gap-[6px] items-center"><p className="font-['Unbounded:ExtraBold'] text-[#f72585] text-[11px]">TORONTO BLUE JAYS</p><div className="size-[4px]" data-name="sep" /><p className="font-['Inter:Semi_Bold'] text-[#9090a8] text-[11px]">OFFICIAL MASCOT</p></div>
    <p className="font-['Unbounded:Black'] text-[22px] text-white">ACE THE BLUE JAY</p>
  </div>
  <div className="flex flex-col gap-[12px] w-full" data-name="action-dock-grid">
    <p className="font-['Inter:Bold'] text-[#9090a8] text-[11px]">INTERACTION DOCK</p>
    <div className="flex justify-between w-full" data-name="dock-row-1">
      <div className="flex flex-col gap-[6px] items-center w-[100px]" data-name="dock-Animation">
        <div className="bg-[#9d4edd] border-[#f72585] border-[1.5px] drop-shadow-[0px_0px_8px_#9d4edd] flex items-center justify-center rounded-[27px] size-[54px]"><img src={imgRefreshCw} className="size-[22px]" /></div>
        <p className="font-['Inter:Semi_Bold'] text-[11px] text-white">Animation</p>
      </div>
      <!-- dock-Info (info) · dock-Video (video): bg-[#141420] border-[1.5px] border-[rgba(255,255,255,0.08)], etiqueta #9090a8 -->
    </div>
    <div className="flex justify-between w-full" data-name="dock-row-2">
      <!-- dock-Effects (sparkles) · dock-Stats (bar-chart-2) · dock-Trivia (help-circle) -->
    </div>
  </div>
</div>
```
