# ar-combined-screen (nodeId 20:53) — ruta /ar

Respuesta cruda de `get_design_context`. Frame 402×874. Extraído 2026-09-04.
Es la pantalla real de /ar: modelo anclado + dock de interacción. `ar-hub-screen` (4:170) es solo referencia del panel.

## Captura (descripción)

- Fondo: foto de estadio de noche (viewfinder-bg.png) a sangre, recortada `left -12.13%`, `top -4.3%`, `w 124.24%`, `h 100%`. Encima overlay rgba(0,0,0,.46) con padding-top 20. En la imagen se ve una cuadrícula tenue y el marco guía con esquinas y un punto central: forman parte de la imagen de fondo (no hay nodos aparte).
- Barra de estado iOS 44px: NO reproducir.
- top-controls (px 20, fila space-between): botón back 40×40 redondo, fondo rgba(0,0,0,.67), borde rgba(255,255,255,.08), icono arrow-left 18 blanco. Chip "AR HUB ACTIVE": fondo rgba(247,37,133,.25), borde 1px #f72585, radio 16, px 12 py 6, punto pulse 8px rosa + Inter Bold 11 blanco, gap 6.
- bottom-sheet: ocupa 663px de alto, fondo transparente rgba(24,24,41,0), borde superior rgba(255,255,255,.08), radios superiores 32, sombra 0 8 24 rgba(0,0,0,.5). Dentro, posicionado absoluto:
  - mascot-info arriba (left/right 24, top -1): fila "TORONTO BLUE JAYS" Unbounded ExtraBold 11 #f72585 · punto sep 4px · "OFFICIAL MASCOT" Inter Semi Bold 11 #9090a8; debajo "ACE THE BLUE JAY" Unbounded Black 22 blanco. Gap 4.
  - Columna izquierda vertical (left 1, ancho 100): Trivia (top 245, help-circle), Stats (top 331, bar-chart-2), Info (top 417, info). Separación vertical 86.
  - Fila inferior (top 589): Effects (left 51, sparkles), Animation (left 151, refresh-cw, ACTIVO), Video (left 251, video). Separación horizontal 100.
  - Botón dock: círculo 54, radio 27, fondo #141420, borde 1.5px rgba(255,255,255,.08), icono 22 (#9090a8 inactivo). Etiqueta Inter Semi Bold 11 #9090a8 a 60px del top, centrada bajo el círculo. Alto total del bloque 73.
  - Botón activo (Animation): fondo #9d4edd, borde 1.5px #f72585, drop-shadow 0 0 8 #9d4edd, icono blanco, etiqueta blanca.
- Tab bar 72 igual que home. En este frame el diseño marca "Home" con etiqueta blanca pero el icono rosa es el de Scan (inconsistencia del diseño). En la app la pestaña activa en /ar será Scan.
- Home indicator: NO reproducir.

## Layout de dock a implementar

Seis botones en dos grupos: tres verticales pegados al borde izquierdo (Trivia, Stats, Info) a media altura, y tres horizontales centrados abajo (Effects, Animation, Video) justo encima de la tab bar. Los tres de abajo están espaciados 100px entre centros (con ancho 402: centros en 101, 201, 301 → centrado). Reproducir con flex centrado y gap 46 (100 − 54) para que sea fluido.

## Assets

| archivo local | uso | URL |
|---|---|---|
| viewfinder-bg.png | fondo de estadio de /ar (y /scan si coincide) | https://www.figma.com/api/mcp/asset/5c65823a-1024-460f-90fa-381cbe3afe5b.png |

Iconos SVG (arrow-left, pulse, sep, video, help-circle, sparkles, bar-chart-2, info, refresh-cw, tab bar): se generan inline con lucide. `pulse` y `sep` son círculos simples (8px rosa, 4px #9090a8).

## Código devuelto (React + Tailwind, referencia)

```jsx
const imgViewfinderBg = "https://www.figma.com/api/mcp/asset/5c65823a-1024-460f-90fa-381cbe3afe5b.png";
// + SVGs: imgArrowLeft, imgPulse, imgSep, imgVideo, imgHelpCircle, imgSparkles, imgBarChart2, imgInfo, imgRefreshCw, imgHome, imgPlayCircle, imgAperture, imgLayers, imgGamepad

export default function ArCombinedScreen() {
  return (
    <div className="bg-[#0c0c12] border border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-start justify-between overflow-clip relative rounded-[40px] size-full" data-node-id="20:53" data-name="ar-combined-screen">
      <div className="absolute inset-[-1px]" data-node-id="20:54" data-name="viewfinder-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-12.13%] max-w-none top-[-4.3%] w-[124.24%]" src={imgViewfinderBg} />
        </div>
      </div>
      <div className="absolute bg-[rgba(0,0,0,0.46)] content-stretch flex flex-col inset-[-1px] items-center justify-between pt-[20px]" data-node-id="20:55" data-name="viewfinder-overlay">
        <!-- status-bar 44px (9:41, signal, wifi, battery) -->
        <div className="content-stretch flex items-center justify-between px-[20px] relative shrink-0 w-full" data-node-id="20:157" data-name="top-controls">
          <div className="bg-[rgba(0,0,0,0.67)] border border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-center justify-center relative rounded-[20px] shrink-0 size-[40px]" data-node-id="20:158" data-name="back-ar-btn">
            <div className="relative shrink-0 size-[18px]" data-node-id="20:159" data-name="arrow-left"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrowLeft} /></div>
          </div>
          <div className="bg-[rgba(247,37,133,0.25)] border border-[#f72585] border-solid content-stretch flex gap-[6px] items-center px-[12px] py-[6px] relative rounded-[16px] shrink-0" data-node-id="20:161" data-name="recording-status">
            <div className="relative shrink-0 size-[8px]" data-node-id="20:162" data-name="pulse"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPulse} /></div>
            <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[normal] not-italic relative shrink-0 text-[11px] text-white whitespace-nowrap" data-node-id="20:163">AR HUB ACTIVE</p>
          </div>
        </div>
        <div className="bg-[rgba(24,24,41,0)] border-[rgba(255,255,255,0.08)] border-solid border-t h-[663px] overflow-clip relative rounded-tl-[32px] rounded-tr-[32px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.5)] shrink-0 w-full" data-node-id="20:114" data-name="bottom-sheet">
          <div className="absolute content-stretch flex flex-col gap-[4px] items-start left-[24px] right-[24px] top-[-1px]" data-node-id="20:117" data-name="mascot-info">
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="20:118" data-name="team-tag">
              <p className="[word-break:break-word] font-['Unbounded:ExtraBold'] font-extrabold leading-[normal] relative shrink-0 text-[#f72585] text-[11px] whitespace-nowrap" data-node-id="20:119">TORONTO BLUE JAYS</p>
              <div className="relative shrink-0 size-[4px]" data-node-id="20:120" data-name="sep"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSep} /></div>
              <p className="[word-break:break-word] font-['Inter:Semi_Bold'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#9090a8] text-[11px] whitespace-nowrap" data-node-id="20:121">OFFICIAL MASCOT</p>
            </div>
            <p className="[word-break:break-word] font-['Unbounded:Black'] font-black leading-[normal] min-w-full relative shrink-0 text-[22px] text-white w-[min-content]" data-node-id="20:122">ACE THE BLUE JAY</p>
          </div>
          <!-- dock-Video: left 251 top 589 -->
          <div className="absolute h-[73px] left-[251px] top-[589px] w-[100px]" data-node-id="20:136" data-name="dock-Video">
            <div className="absolute bg-[#141420] border-[1.5px] border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-center justify-center left-[23px] rounded-[27px] size-[54px] top-0" data-node-id="20:137" data-name="circle-btn">
              <div className="relative shrink-0 size-[22px]" data-node-id="20:138" data-name="video"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVideo} /></div>
            </div>
            <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold'] font-semibold leading-[normal] left-[34.5px] not-italic text-[#9090a8] text-[11px] top-[60px] whitespace-nowrap" data-node-id="20:140">Video</p>
          </div>
          <!-- dock-Trivia: left 1 top 245 (help-circle) · dock-Effects: left 51 top 589 (sparkles) · dock-Stats: left 1 top 331 (bar-chart-2) · dock-Info: left 1 top 417 (info) — misma estructura -->
          <!-- dock-Animation (ACTIVO): left 151 top 589 -->
          <div className="absolute h-[73px] left-[151px] top-[589px] w-[100px]" data-node-id="20:126" data-name="dock-Animation">
            <div className="absolute bg-[#9d4edd] border-[#f72585] border-[1.5px] border-solid content-stretch drop-shadow-[0px_0px_8px_#9d4edd] flex flex-col items-center justify-center left-[23px] rounded-[27px] size-[54px] top-0" data-node-id="20:127" data-name="circle-btn">
              <div className="relative shrink-0 size-[22px]" data-node-id="20:128" data-name="refresh-cw"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgRefreshCw} /></div>
            </div>
            <p className="[word-break:break-word] absolute font-['Inter:Semi_Bold'] font-semibold leading-[normal] left-[22.5px] not-italic text-[11px] text-white top-[60px] whitespace-nowrap" data-node-id="20:130">Animation</p>
          </div>
        </div>
        <div className="content-stretch flex flex-col h-[4px] items-center px-[40px] relative shrink-0 w-full" data-node-id="20:85" data-name="instructional-overlay" />
        <!-- bottom-nav-area: tab-bar 72 (igual que home) + home-indicator -->
      </div>
    </div>
  );
}
```
