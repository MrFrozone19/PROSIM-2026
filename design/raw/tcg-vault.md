# tcg-vault (nodeId 4:317) — ruta /vault

Respuesta cruda de `get_design_context`. Copia del archivo: fileKey `hxwh2tRvdUhhLhe4ciEdNq` (mismos node IDs que el original). Frame 402×874. Extraído 2026-09-04.

## Captura (descripción)

- Cuerpo px 20, gap 16. Sin título de pantalla: empieza directo con la tarjeta de estadísticas.
- vault-header-stats: tarjeta fondo #141420, borde rgba(255,255,255,.08), radio 16, p 12, fila space-between.
  - Izquierda: "UNLOCKED CLIPS" Inter Bold 10 #9090a8; debajo fila gap 6: icono award 18 rosa + "24/60" Unbounded Black 16 blanco. Gap 4.
  - Derecha (ancho 180): fila "VAULT TIER 4" Inter Bold 10 #9090a8 / "40%" Inter Bold 10 #f72585; barra 6px radio 3 fondo rgba(255,255,255,.08) con relleno gradiente #9d4edd→#f72585 de 72px (40%). Gap 6.
- featured-unlock-banner: 85px alto, radio 16, borde 1px #9d4edd, fondo gradiente horizontal rgba(255,255,255,.06)→.01, p 12, gap 12. Imagen promo con opacity 0 (oculta). Izquierda: cuadrado 48 radio 12 fondo #9d4edd borde 1.5 #f72585 con icono award 24 blanco. Textos gap 2: "LATEST AR TROPHY UNLOCKED" Inter ExtraBold 10 #f72585; "AL EAST CHAMPIONS" Unbounded Bold 12 blanco; "Spawn virtual ring inside AR scanner now" Inter Regular 10 #9090a8.
- category-tabs: chips gap 8, px 16 py 8, radio 20, Inter Bold 11 blanco; fondo #141420 borde rgba(255,255,255,.08). Activo (Cards): fondo #9d4edd borde #f72585. Orden: Trophies, Cards, Badges.
- grid: 2 filas de 3 tarjetas, gap 12, cada una flex-1, 130px alto, radio 12, fondo #141420, imagen con opacity 0 (oculta). Overlay p 8 space-between: badge de rareza arriba (Inter Regular 8 blanco, radio 4, px 6 py 2) y nombre abajo Inter ExtraBold 10 blanco ellipsis.
  - Fila 1 (raras, con borde 1.5 y glow 0 0 16 del mismo color; badge fondo #f72585; overlay rgba(0,0,0,.31)): MYTHIC "Astros Orbit" #fe2c55 · LEGENDARY "Yankees Pinstripe" #ddad4e · EPIC "Sox Green Monster" #9d4edd.
  - Fila 2 (comunes, borde 1px rgba(255,255,255,.08), sin glow; badge fondo rgba(0,0,0,.67); overlay rgba(0,0,0,.52)): RARE "Blue Jay Ace" · UNCOMMON "Oriole Bird" · COMMON "Texas Ranger".
- Tab bar: TCG Vault activo. Home indicator: NO reproducir.

## Comportamiento a implementar (según encargo)

- Tocar una carta abre un detalle modal con la rareza y datos falsos.
- Chips Trophies / Cards / Badges cambian el contenido (datos de relleno en data/trophies.ts y data/cards.ts).

## Assets

| archivo local | uso | URL |
|---|---|---|
| vault-promo.png | fondo del banner (oculto en diseño) | https://www.figma.com/api/mcp/asset/3ab98f58-23b0-4d17-bcf1-14955a56f878.png |
| card-astros-orbit.png | carta 2 (mythic) | https://www.figma.com/api/mcp/asset/85c5b0d2-e022-4f47-bbbf-b120ac260f69.png |
| card-yankees-pinstripe.png | carta 0 (legendary) | https://www.figma.com/api/mcp/asset/2e720fe7-5990-42b5-8508-dcb39c39f9bb.png |
| card-sox-green-monster.png | carta 1 (epic) | https://www.figma.com/api/mcp/asset/e7041da1-0c09-4f98-b263-fd2dbeb1b958.png |
| card-blue-jay-ace.png | carta 3 (rare) | https://www.figma.com/api/mcp/asset/cb4bf22c-447a-46ac-8af2-7a834e0f986b.png |
| card-oriole-bird.png | carta 4 (uncommon) | https://www.figma.com/api/mcp/asset/f2ee0721-4666-4554-91b1-c27a2da191b3.png |
| card-texas-ranger.png | carta 5 (common) | https://www.figma.com/api/mcp/asset/f5ab0335-b538-4047-87e9-f3e4f5ea71ae.png |

Todas las imágenes están con opacity 0 en el diseño (placeholders). Se descargan por si sirven como arte de las cartas.

## Código devuelto (React + Tailwind, referencia resumida; las tarjetas se repiten)

```jsx
const imgPromoImg = ".../3ab98f58-23b0-4d17-bcf1-14955a56f878.png";
const imgImg..imgImg5 = cartas (ver tabla)

export default function TcgVault() {
  return (
    <div className="bg-[#0c0c12] ... rounded-[40px] size-full" data-node-id="4:317" data-name="tcg-vault">
      <!-- status-bar 44 -->
      <div className="flex flex-col gap-[16px] px-[20px] w-full" data-node-id="4:326" data-name="vault-content">
        <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex items-center justify-between p-[12px] rounded-[16px] w-full" data-node-id="4:327" data-name="vault-header-stats">
          <div className="flex flex-col gap-[4px]" data-name="trophy-count">
            <p className="font-['Inter:Bold'] text-[#9090a8] text-[10px]">UNLOCKED CLIPS</p>
            <div className="flex gap-[6px] items-center" data-name="counter">
              <div className="size-[18px]" data-name="award"><img src={imgAward} /></div>
              <p className="font-['Unbounded:Black'] text-[16px] text-white">24/60</p>
            </div>
          </div>
          <div className="flex flex-col gap-[6px] w-[180px]" data-name="level-progress">
            <div className="flex font-['Inter:Bold'] justify-between text-[10px] w-full" data-name="prog-meta">
              <p className="text-[#9090a8]">VAULT TIER 4</p><p className="text-[#f72585]">40%</p>
            </div>
            <div className="bg-[rgba(255,255,255,0.08)] flex h-[6px] overflow-clip rounded-[3px] w-full" data-name="bar">
              <div className="bg-gradient-to-r from-[#9d4edd] h-full to-[#f72585] w-[72px]" data-name="fill" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r border border-[#9d4edd] flex from-[rgba(255,255,255,0.06)] gap-[12px] h-[85px] items-center overflow-clip p-[12px] relative rounded-[16px] to-[rgba(255,255,255,0.01)] w-full" data-node-id="4:339" data-name="featured-unlock-banner">
          <div className="absolute inset-[-1px] opacity-30" data-name="promo-img"><img className="... opacity-0" src={imgPromoImg} /></div>
          <div className="bg-[#9d4edd] border-[#f72585] border-[1.5px] flex items-center justify-center rounded-[12px] size-[48px]" data-name="trophy-badge"><div className="size-[24px]"><img src={imgAward1} /></div></div>
          <div className="flex flex-[1_0_0] flex-col gap-[2px]" data-name="promo-details">
            <p className="font-['Inter:Extra_Bold'] text-[#f72585] text-[10px]">LATEST AR TROPHY UNLOCKED</p>
            <p className="font-['Unbounded:Bold'] text-[12px] text-white">AL EAST CHAMPIONS</p>
            <p className="font-['Inter:Regular'] text-[#9090a8] text-[10px]">Spawn virtual ring inside AR scanner now</p>
          </div>
        </div>
        <div className="flex gap-[8px] w-full" data-name="category-tabs">
          <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] px-[16px] py-[8px] rounded-[20px]" data-name="tab-Trophies"><p className="font-['Inter:Bold'] text-[11px] text-white">Trophies</p></div>
          <div className="bg-[#9d4edd] border border-[#f72585] px-[16px] py-[8px] rounded-[20px]" data-name="tab-Cards"><p className="font-['Inter:Bold'] text-[11px] text-white">Cards</p></div>
          <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] px-[16px] py-[8px] rounded-[20px]" data-name="tab-Badges"><p className="font-['Inter:Bold'] text-[11px] text-white">Badges</p></div>
        </div>
        <div className="flex flex-col gap-[12px] w-full" data-name="grid">
          <div className="flex gap-[12px] w-full" data-name="row-1">
            <div className="bg-[#141420] border-[#fe2c55] border-[1.5px] flex flex-[1_0_0] flex-col h-[130px] overflow-clip relative rounded-[12px] shadow-[0px_0px_16px_0px_#fe2c55]" data-name="card-2">
              <div className="flex-[1_0_0] relative w-full" data-name="img"><img className="... opacity-0" src={imgImg} /></div>
              <div className="absolute bg-[rgba(0,0,0,0.31)] flex flex-col inset-[-1.5px] justify-between p-[8px]" data-name="meta-overlay">
                <div className="bg-[#f72585] px-[6px] py-[2px] rounded-[4px]" data-name="badge"><p className="font-['Inter:Regular'] text-[8px] text-white">MYTHIC</p></div>
                <p className="font-['Inter:Extra_Bold'] overflow-hidden text-[10px] text-ellipsis text-white whitespace-nowrap">Astros Orbit</p>
              </div>
            </div>
            <!-- card-0 LEGENDARY border #ddad4e glow · card-1 EPIC border #9d4edd glow -->
          </div>
          <div className="flex gap-[12px] w-full" data-name="row-2">
            <div className="bg-[#141420] border border-[rgba(255,255,255,0.08)] flex flex-[1_0_0] flex-col h-[130px] overflow-clip relative rounded-[12px]" data-name="card-3">
              <div className="absolute bg-[rgba(0,0,0,0.52)] flex flex-col inset-[-1px] justify-between p-[8px]" data-name="meta-overlay">
                <div className="bg-[rgba(0,0,0,0.67)] px-[6px] py-[2px] rounded-[4px]" data-name="badge"><p className="text-[8px] text-white">RARE</p></div>
                <p className="font-['Inter:Extra_Bold'] text-[10px] text-white">Blue Jay Ace</p>
              </div>
            </div>
            <!-- card-4 UNCOMMON Oriole Bird · card-5 COMMON Texas Ranger -->
          </div>
        </div>
      </div>
      <!-- bottom-nav-area: tab-bar (TCG Vault activo) + home-indicator -->
    </div>
  );
}
```
