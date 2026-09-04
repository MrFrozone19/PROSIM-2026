# ar-scanner-screen (nodeId 4:133) — ruta /scan

Respuesta cruda de `get_design_context`. Frame 402×874. Extraído 2026-09-04.

## Captura (descripción)

- Fondo: misma foto de estadio (viewfinder-bg) con recorte idéntico a /ar (`left -12.13%`, `top -4.3%`, `w 124.24%`). En la app el fondo será el video en vivo de la cámara; la imagen queda como fallback cuando no hay cámara.
- Overlay rgba(0,0,0,.46), columna centrada `justify-between`, padding-top 20.
- Barra de estado: NO reproducir.
- scanner-top-bar (px 24): chip "SCANNER ACTIVE" fondo rgba(0,0,0,.6), borde rgba(255,255,255,.08), radio 16, px 12 py 6, gap 8, punto glowing-pulse 8px color cian/verde (#2ee6c5 aprox., en la captura se ve verde-agua) + Inter Bold 12 blanco. Botón cerrar 40×40 redondo mismo fondo/borde, icono x 18 blanco.
- scanner-reticle-container: cuadrado 260×260 centrado. Cuatro esquinas de 30×30 en morado #9d4edd (trazo ~2px, forma de L). En la captura hay además un marco blanco más pequeño con un punto central, que es parte de la imagen de fondo.
- instructional-overlay (px 40, gap 8, centrado): "POINT AT A TEAM LOGO" Unbounded Bold 14 blanco; "Scanning for AR stadium triggers..." Inter Regular 12 #9090a8; loader-bar 140×4 radio 2 fondo rgba(255,255,255,.13) con relleno #f72585 de 80px (animar como barra indeterminada).
- Tab bar 72: en este frame Scan tiene icono rosa y Home etiqueta blanca (misma inconsistencia). En la app, Scan activo.
- Home indicator: NO reproducir.

## Comportamiento a implementar (según encargo)

- Pedir cámara con getUserMedia facingMode environment, mostrar `<video>` detrás del overlay.
- Estados: concedido / rechazado (mensaje + reintentar) / sin soporte.
- Botón "Simular detección" con estilo de la casa → /ar.
- Cerrar (x) → Location.back().

## Assets

| archivo local | uso | URL |
|---|---|---|
| viewfinder-bg-scan.png | fondo fallback de /scan (comparar con viewfinder-bg.png) | https://www.figma.com/api/mcp/asset/c66f319d-ea02-4c5e-863f-2ffb1875f7e0.png |

SVGs (glowing-pulse, x, corner-tl/tr/bl/br, tab bar): las esquinas se dibujan con CSS (borde en L), el resto con lucide.

## Código devuelto (React + Tailwind, referencia)

```jsx
const imgViewfinderBg = "https://www.figma.com/api/mcp/asset/c66f319d-ea02-4c5e-863f-2ffb1875f7e0.png";
// SVGs: imgGlowingPulse, imgX, imgCornerTl, imgCornerTr, imgCornerBl, imgCornerBr, imgHome, imgPlayCircle, imgAperture, imgLayers, imgGamepad

export default function ArScannerScreen() {
  return (
    <div className="bg-[#0c0c12] border border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-start justify-between overflow-clip relative rounded-[40px] size-full" data-node-id="4:133" data-name="ar-scanner-screen">
      <div className="absolute inset-[-1px]" data-node-id="4:134" data-name="viewfinder-bg">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-12.13%] max-w-none top-[-4.3%] w-[124.24%]" src={imgViewfinderBg} />
        </div>
      </div>
      <div className="absolute bg-[rgba(0,0,0,0.46)] content-stretch flex flex-col inset-[-1px] items-center justify-between pt-[20px]" data-node-id="4:135" data-name="viewfinder-overlay">
        <!-- status-bar 44px -->
        <div className="content-stretch flex items-center justify-between px-[24px] relative shrink-0 w-full" data-node-id="4:142" data-name="scanner-top-bar">
          <div className="bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.08)] border-solid content-stretch flex gap-[8px] items-center px-[12px] py-[6px] relative rounded-[16px] shrink-0" data-node-id="4:143" data-name="ar-status-badge">
            <div className="relative shrink-0 size-[8px]" data-node-id="4:144" data-name="glowing-pulse"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGlowingPulse} /></div>
            <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[normal] not-italic relative shrink-0 text-[12px] text-white whitespace-nowrap" data-node-id="4:145">SCANNER ACTIVE</p>
          </div>
          <div className="bg-[rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-center justify-center relative rounded-[20px] shrink-0 size-[40px]" data-node-id="4:146" data-name="close-btn">
            <div className="relative shrink-0 size-[18px]" data-node-id="4:551" data-name="x"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgX} /></div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 size-[260px]" data-node-id="4:148" data-name="scanner-reticle-container">
          <div className="absolute left-0 size-[30px] top-0" data-node-id="4:149" data-name="corner-tl">…</div>
          <div className="absolute right-0 size-[30px] top-0" data-node-id="4:152" data-name="corner-tr">…</div>
          <div className="absolute bottom-[-0.5px] ... left-0 w-[30px]" data-node-id="4:155"><!-- corner-bl (escala Y invertida) --></div>
          <div className="absolute bottom-[-0.5px] ... right-0 w-[30px]" data-node-id="4:158"><!-- corner-br (escala Y invertida) --></div>
        </div>
        <div className="content-stretch flex flex-col gap-[8px] items-center px-[40px] relative shrink-0 w-full" data-node-id="4:163" data-name="instructional-overlay">
          <p className="[word-break:break-word] font-['Unbounded:Bold'] font-bold leading-[normal] min-w-full relative shrink-0 text-[14px] text-center text-white w-[min-content]" data-node-id="4:164">POINT AT A TEAM LOGO</p>
          <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[normal] min-w-full not-italic relative shrink-0 text-[#9090a8] text-[12px] text-center w-[min-content]" data-node-id="4:165">Scanning for AR stadium triggers...</p>
          <div className="bg-[rgba(255,255,255,0.13)] content-stretch flex h-[4px] items-start overflow-clip relative rounded-[2px] shrink-0 w-[140px]" data-node-id="4:166" data-name="loader-bar">
            <div className="bg-[#f72585] h-full relative shrink-0 w-[80px]" data-node-id="4:167" data-name="loader-fill" />
          </div>
        </div>
        <!-- bottom-nav-area: tab-bar 72 + home-indicator (igual que home) -->
      </div>
    </div>
  );
}
```
