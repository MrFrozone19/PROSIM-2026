# video-gallery (nodeId 4:224) — ruta /videos

Respuesta cruda de `get_design_context`. Frame 402×874. Extraído 2026-09-04.

## Captura (descripción)

- Cuerpo px 20, gap 16 entre bloques.
- Header: "AR STUDIO" Unbounded Black 20 blanco; "Capture and customize fan experiences" Inter Regular 12 #9090a8. Gap 4.
- video-player-container: 200px alto, radio 16, fondo #141420, borde rgba(255,255,255,.08), overflow clip. Imagen de video (video-poster.png) con opacity 0 en el diseño (se ve negro). Overlay rgba(0,0,0,.38) p 12, columna space-between:
  - overlay-top: badge "THERMAL FILTER" fondo #f72585 radio 6 px 8 py 4 Inter ExtraBold 10 blanco; icono maximize 18 blanco a la derecha.
  - play-row: play-circle 48 blanco centrado con halo (inset -27% → resplandor suave).
  - scrubber: "0:12" Inter Regular 11 blanco · track flex-1 4px radio 2 rgba(255,255,255,.19) con progreso #9d4edd (110px) y knob 10×12 blanco (círculo) · "0:24" Inter Regular 11 #9090a8. Gap 8.
- filters-section: etiqueta "AR RENDER ENGINE FILTERS" Inter Bold 11 #9090a8 (nota: aquí es Inter, no Unbounded). Chips flex-wrap gap 8: fondo #141420 borde rgba(255,255,255,.08) radio 16 px 12 py 8 Inter Bold 11 blanco. Activo (Thermal): fondo #9d4edd borde #f72585. Orden: Pixelate, Thermal, Pastel, Blur, Color Adjust.
- "YOUR FAVORITE CLIPS" Inter Bold 11 #9090a8, gap 12. Grid 2 columnas gap 12, tarjetas 130px alto radio 12 fondo #141420 borde rgba(255,255,255,.08). Imagen con opacity 0 en favoritos (se ve fondo oscuro). Overlay rgba(0,0,0,.44) p 10, space-between: fila meta (icono play 16 blanco, duración Inter Regular 10 blanco) y título Inter Bold 11 blanco con ellipsis. Clips: Mascot Fly-by 0:15, Neon Homerun 0:24, Retro Stadium 0:45, Mascot Dance 0:30.
- "ALL RECORDED CLIPS" misma grid, aquí las imágenes SÍ son visibles (clip-1..4.png), mismos cuatro clips.
- Tab bar 72: Videos activo (icono rosa, etiqueta blanca Bold). Home indicator: NO reproducir.

## Comportamiento a implementar (según encargo)

- Reproductor real `<video>` con clip libre de derechos o canvas animado.
- Filtros reales: Pixelate, Thermal, Pastel, Blur, Color Adjust con deslizante de intensidad y toggle para comparar con el original.
- Prohibidos: blanco y negro, escala de grises, sepia, exposición, invertidos.

## Assets

| archivo local | uso | URL |
|---|---|---|
| video-poster.png | imagen del reproductor (oculta en diseño) | https://www.figma.com/api/mcp/asset/85617db7-35c1-4587-9ad5-009de5c500b0.png |
| clip-1.png | miniatura Mascot Fly-by | https://www.figma.com/api/mcp/asset/6ba8cd21-324c-416a-a0d1-c9617d6468ff.png |
| clip-2.png | miniatura Neon Homerun | https://www.figma.com/api/mcp/asset/af731565-072b-4ffc-adbd-2bf3743688f6.png |
| clip-3.png | miniatura Retro Stadium | https://www.figma.com/api/mcp/asset/05ff8c02-8e73-46df-99b2-d85547edc289.png |
| clip-4.png | miniatura Mascot Dance | https://www.figma.com/api/mcp/asset/a21c7505-cde4-489a-aab0-6b679f24f276.png |

SVGs (maximize, play-circle, knob, play, tab bar): lucide / CSS.

## Código devuelto (React + Tailwind, referencia resumida; las tarjetas se repiten)

```jsx
const imgVideoImg = "https://www.figma.com/api/mcp/asset/85617db7-35c1-4587-9ad5-009de5c500b0.png";
const imgImg = "https://www.figma.com/api/mcp/asset/6ba8cd21-324c-416a-a0d1-c9617d6468ff.png";
const imgImg1 = "https://www.figma.com/api/mcp/asset/af731565-072b-4ffc-adbd-2bf3743688f6.png";
const imgImg2 = "https://www.figma.com/api/mcp/asset/05ff8c02-8e73-46df-99b2-d85547edc289.png";
const imgImg3 = "https://www.figma.com/api/mcp/asset/a21c7505-cde4-489a-aab0-6b679f24f276.png";

export default function VideoGallery() {
  return (
    <div className="bg-[#0c0c12] ... rounded-[40px] size-full" data-node-id="4:224" data-name="video-gallery">
      <!-- status-bar 44 -->
      <div className="... flex-col gap-[16px] px-[20px] w-full" data-node-id="4:233" data-name="gallery-content">
        <div className="flex flex-col gap-[4px] w-full" data-node-id="4:234" data-name="header">
          <p className="font-['Unbounded:Black'] font-black text-[20px] text-white w-full" data-node-id="4:235">AR STUDIO</p>
          <p className="font-['Inter:Regular'] text-[#9090a8] text-[12px] w-full" data-node-id="4:236">Capture and customize fan experiences</p>
        </div>
        <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex flex-col h-[200px] overflow-clip relative rounded-[16px] w-full" data-node-id="4:237" data-name="video-player-container">
          <div className="flex-[1_0_0] min-h-px relative w-full" data-name="video-img"><img className="absolute inset-0 object-cover opacity-0 size-full" src={imgVideoImg} /></div>
          <div className="absolute bg-[rgba(0,0,0,0.38)] flex flex-col inset-[-1px] justify-between p-[12px]" data-name="player-overlay">
            <div className="flex items-start justify-between w-full" data-name="overlay-top">
              <div className="bg-[#f72585] flex px-[8px] py-[4px] rounded-[6px]" data-name="filter-badge"><p className="font-['Inter:Extra_Bold'] text-[10px] text-white">THERMAL FILTER</p></div>
              <div className="size-[18px]" data-name="maximize"><img src={imgMaximize} /></div>
            </div>
            <div className="flex items-center justify-center w-full" data-name="play-row"><div className="size-[48px]" data-name="play-circle"><div className="absolute inset-[-27.09%]"><img src={imgPlayCircle} /></div></div></div>
            <div className="flex gap-[8px] items-center w-full" data-name="scrubber">
              <p className="font-['Inter:Regular'] text-[11px] text-white">0:12</p>
              <div className="bg-[rgba(255,255,255,0.19)] flex flex-[1_0_0] h-[4px] relative rounded-[2px]" data-name="track">
                <div className="bg-[#9d4edd] h-full w-[110px]" data-name="progress" />
                <div className="absolute h-[12px] left-[105px] top-[-4px] w-[10px]" data-name="knob"><img src={imgKnob} /></div>
              </div>
              <p className="font-['Inter:Regular'] text-[#9090a8] text-[11px]">0:24</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[8px] w-full" data-name="filters-section">
          <p className="font-['Inter:Bold'] text-[#9090a8] text-[11px]">AR RENDER ENGINE FILTERS</p>
          <div className="flex flex-wrap gap-[8px] w-full" data-name="filter-row">
            <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] px-[12px] py-[8px] rounded-[16px]" data-name="chip-Pixelate"><p className="font-['Inter:Bold'] text-[11px] text-white">Pixelate</p></div>
            <div className="bg-[#9d4edd] border border-[#f72585] px-[12px] py-[8px] rounded-[16px]" data-name="chip-Thermal"><p className="font-['Inter:Bold'] text-[11px] text-white">Thermal</p></div>
            <!-- chip-Pastel, chip-Blur, chip-Color Adjust (inactivos) -->
          </div>
        </div>
        <div className="flex flex-col gap-[12px] w-full" data-name="video-grid-section">
          <p className="font-['Inter:Bold'] text-[#9090a8] text-[11px]">YOUR FAVORITE CLIPS</p>
          <div className="flex flex-col gap-[12px] w-full" data-name="grid">
            <div className="flex gap-[12px] w-full" data-name="row-1">
              <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex flex-[1_0_0] flex-col h-[130px] overflow-clip relative rounded-[12px]" data-name="vid-card-0">
                <div className="flex-[1_0_0] relative w-full" data-name="img"><img className="absolute inset-0 object-cover opacity-0 size-full" src={imgImg} /></div>
                <div className="absolute bg-[rgba(0,0,0,0.44)] flex flex-col inset-[-1px] justify-between p-[10px]" data-name="text-overlay">
                  <div className="flex items-start justify-between w-full" data-name="meta">
                    <div className="size-[16px]" data-name="play"><img src={imgPlay} /></div>
                    <p className="font-['Inter:Regular'] text-[10px] text-white">0:15</p>
                  </div>
                  <p className="font-['Inter:Bold'] overflow-hidden text-[11px] text-ellipsis text-white w-full whitespace-nowrap">Mascot Fly-by</p>
                </div>
              </div>
              <!-- vid-card-1 Neon Homerun 0:24 -->
            </div>
            <!-- row-2: Retro Stadium 0:45, Mascot Dance 0:30 -->
          </div>
        </div>
        <div className="flex flex-col gap-[12px] w-full" data-node-id="3:188" data-name="video-grid-section">
          <p className="font-['Inter:Bold'] text-[#9090a8] text-[11px]">ALL RECORDED CLIPS</p>
          <!-- misma grid, imágenes visibles (sin opacity-0) -->
        </div>
      </div>
      <!-- bottom-nav-area: tab-bar (Videos activo) + home-indicator -->
    </div>
  );
}
```
