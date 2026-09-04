# home-screen (nodeId 4:65) — ruta /home

Respuesta cruda de `get_design_context` (Figma MCP), fileKey `RtqQKSttKt2LFfqXWKkvOA`.
Frame 402×874. Extraído 2026-09-04.

## Captura (descripción, la imagen no se puede guardar desde el MCP)

- Fondo #0c0c12. Barra de estado iOS (44px) arriba: NO reproducir en la web.
- Encabezado: wordmark "BaseDex Fan" Unbounded Black 22 con gradiente horizontal #9d4edd→#f72585 (texto con clip). A la derecha avatar circular 32px (ilustración usuario azul/blanco con borde rosa).
- Hero card 320px alto, radio 24, borde rgba(255,255,255,.08), sombra 0 8 24 rgba(0,0,0,.5). Imagen de fondo: tres beisbolistas (Reds rojo, Dodgers azul, Yankees gris) recortada (`h 109.52%`, `left -58.47%`, `w 172.12%`). Overlay degradado vertical transparente→rgba(12,12,18,.98) con padding 20. Texto arriba-izquierda: "SCAN. PLAY. COLLECT." Unbounded Bold 18 blanco; debajo "Experience the stadium with AR from your phone" Inter Semi Bold 12 color #f73e92.
- CTA 60px alto, radio 30, gradiente #9d4edd→#f72585, drop-shadow 0 0 8 #9d4edd. Icono aperture 24 blanco + "START AR SCANNER" Unbounded Black 16 blanco. Gap 12.
- Sección "AL TEAM CHANNELS": Unbounded Bold 12 #9090a8. Fila de badges gap 14, overflow clip (scroll horizontal): NYY (activo: borde 2px #f72585, etiqueta blanca), BOS, HOU, TOR, BAL (borde 2px rgba(255,255,255,.08), etiqueta #9090a8). Badge: círculo 64 fondo #141420, logo 48 redondeado 24 object-cover. Etiqueta Inter Bold 11, gap 6.
- Gap vertical entre bloques del cuerpo: 20. Padding lateral 20.
- Tab bar 72px fondo #141420 border-top rgba(255,255,255,.08), px 16, 5 tabs de 64px: Home (activo, icono rosa, Inter Bold 10 blanco), Videos, Scan, TCG Vault, Game (icono #9090a8, Inter Medium 10 #9090a8). Iconos 22px Lucide: home, play-circle, aperture, layers, gamepad.
- Home indicator 134×5 blanco 50%: NO reproducir.

## Assets (URLs caducan en 7 días; descargados a src/assets/figma/)

| archivo local | uso | URL |
|---|---|---|
| avatar.png | avatar del encabezado 32px | https://www.figma.com/api/mcp/asset/4d1a46cb-8abe-42b4-84ba-abbb7a597606.png |
| hero-mascot.png | fondo hero card | https://www.figma.com/api/mcp/asset/a5733403-b011-4297-a4cb-ed784c92bb5f.png |
| logo-nyy.png | badge NYY | https://www.figma.com/api/mcp/asset/db1ae463-d990-4bcb-b3c9-2a1f6f87d9b5.png |
| logo-bos.png | badge BOS | https://www.figma.com/api/mcp/asset/21b7ee3f-bba0-4c33-b159-d57580af7a73.png |
| logo-hou.png | badge HOU | https://www.figma.com/api/mcp/asset/4954814f-b470-4920-8540-cf2930cb9c6a.png |
| logo-tor.png | badge TOR | https://www.figma.com/api/mcp/asset/3798f2c2-0b67-462c-93c0-39755ea792f4.png |
| logo-bal.png | badge BAL | https://www.figma.com/api/mcp/asset/446b67c7-3c6b-4011-88d4-4d204dbf5e75.png |

SVGs de iconos (status bar y Lucide) no se descargan: la barra de estado no se reproduce y los iconos se generan inline desde lucide.

## Código devuelto (React + Tailwind, referencia)

```jsx
const imgAvatar = "https://www.figma.com/api/mcp/asset/4d1a46cb-8abe-42b4-84ba-abbb7a597606.png";
const imgMascotImg = "https://www.figma.com/api/mcp/asset/a5733403-b011-4297-a4cb-ed784c92bb5f.png";
const imgTeamLogoImg = "https://www.figma.com/api/mcp/asset/db1ae463-d990-4bcb-b3c9-2a1f6f87d9b5.png";
const imgTeamLogoImg1 = "https://www.figma.com/api/mcp/asset/21b7ee3f-bba0-4c33-b159-d57580af7a73.png";
const imgTeamLogoImg2 = "https://www.figma.com/api/mcp/asset/4954814f-b470-4920-8540-cf2930cb9c6a.png";
const imgTeamLogoImg3 = "https://www.figma.com/api/mcp/asset/3798f2c2-0b67-462c-93c0-39755ea792f4.png";
const imgTeamLogoImg4 = "https://www.figma.com/api/mcp/asset/446b67c7-3c6b-4011-88d4-4d204dbf5e75.png";
const imgIosSignal = "https://www.figma.com/api/mcp/asset/66437b69-f45b-427c-9e37-88ff17d91f7d.svg";
const imgIosWifiSignal = "https://www.figma.com/api/mcp/asset/7b0d38e6-dc25-4242-a944-a0f629e6d972.svg";
const imgIosBatteryFull = "https://www.figma.com/api/mcp/asset/ac8180af-cbc5-4178-86b6-ddc1c985d733.svg";
const imgAperture = "https://www.figma.com/api/mcp/asset/49c6c42d-a40b-4aab-91e1-dcc6907e0931.svg";
const imgHome = "https://www.figma.com/api/mcp/asset/bddda952-4633-4198-abaf-795dd81f5125.svg";
const imgPlayCircle = "https://www.figma.com/api/mcp/asset/5d299603-409d-4802-bbb2-bd86378437dd.svg";
const imgAperture1 = "https://www.figma.com/api/mcp/asset/c83ec838-874a-4caa-8bad-a50f772b8bcf.svg";
const imgLayers = "https://www.figma.com/api/mcp/asset/ec97bad7-7411-49c7-9fcf-3d12ec7a2177.svg";
const imgGamepad = "https://www.figma.com/api/mcp/asset/6d877aea-a54d-4ab8-b817-8880e80f3049.svg";

export default function HomeScreen() {
  return (
    <div className="bg-[#0c0c12] border border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col items-start justify-between overflow-clip relative rounded-[40px] size-full" data-node-id="4:65" data-name="home-screen">
      <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-between min-h-px relative w-full" data-node-id="4:66" data-name="screen-content-container">
        <div className="content-stretch flex h-[44px] items-center justify-between px-[24px] relative shrink-0 w-full" data-node-id="4:67" data-name="status-bar">
          <p className="[word-break:break-word] font-['Inter:Semi_Bold'] font-semibold leading-[normal] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap" data-node-id="4:68">9:41</p>
          <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="4:69" data-name="status-icons">
            <div className="relative shrink-0 size-[18px]" data-node-id="4:413" data-name="ios-signal"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIosSignal} /></div>
            <div className="relative shrink-0 size-[18px]" data-node-id="4:416" data-name="ios-wifi-signal"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIosWifiSignal} /></div>
            <div className="h-[16px] relative shrink-0 w-[24px]" data-node-id="4:419" data-name="ios-battery-full"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIosBatteryFull} /></div>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px overflow-clip relative w-full" data-node-id="4:73" data-name="scrollable-body">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-h-px px-[20px] relative w-full" data-node-id="4:74" data-name="home-content">
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="4:75" data-name="branding">
              <div className="content-stretch flex items-center relative shrink-0" data-node-id="4:76" data-name="wordmark-container">
                <p className="[word-break:break-word] bg-clip-text bg-gradient-to-r font-['Unbounded:Black'] font-black from-[#9d4edd] leading-[normal] relative shrink-0 text-[22px] text-[transparent] to-[#f72585] whitespace-nowrap" data-node-id="4:77">BaseDex Fan</p>
              </div>
              <div className="content-stretch flex items-center relative shrink-0" data-node-id="4:80" data-name="user-profile">
                <div className="relative shrink-0 size-[32px]" data-node-id="4:81" data-name="avatar"><img alt="" className="absolute block inset-0 max-w-none size-full" height="32" src={imgAvatar} width="32" /></div>
              </div>
            </div>
            <div className="bg-gradient-to-r border border-[rgba(255,255,255,0.08)] border-solid content-stretch flex flex-col from-[rgba(255,255,255,0.06)] h-[320px] items-start overflow-clip relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.5)] shrink-0 to-[rgba(255,255,255,0.01)] w-full" data-node-id="4:82" data-name="hero-mascot-card">
              <div className="absolute inset-[-1px]" data-node-id="4:83" data-name="mascot-img">
                <div className="absolute inset-0 overflow-hidden pointer-events-none"><img alt="" className="absolute h-[109.52%] left-[-58.47%] max-w-none top-[-1.5%] w-[172.12%]" src={imgMascotImg} /></div>
              </div>
              <div className="absolute bg-gradient-to-b content-stretch flex flex-col from-[rgba(0,0,0,0)] inset-[-1px] items-start justify-between p-[20px] to-[rgba(12,12,18,0.98)]" data-node-id="4:84" data-name="hero-overlay">
                <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[normal] relative shrink-0 w-full" data-node-id="4:85" data-name="hero-text">
                  <p className="font-['Unbounded:Bold'] font-bold relative shrink-0 text-[18px] text-white w-full" data-node-id="4:86">SCAN. PLAY. COLLECT.</p>
                  <p className="font-['Inter:Semi_Bold'] font-semibold not-italic relative shrink-0 text-[#f73e92] text-[12px] w-full" data-node-id="4:87">Experience the stadium with AR from your phone</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r content-stretch drop-shadow-[0px_0px_8px_#9d4edd] flex from-[#9d4edd] gap-[12px] h-[60px] items-center justify-center relative rounded-[30px] shrink-0 to-[#f72585] w-full" data-node-id="4:88" data-name="start-ar-cta">
              <div className="relative shrink-0 size-[24px]" data-node-id="4:422" data-name="aperture"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgAperture} /></div>
              <p className="[word-break:break-word] font-['Unbounded:Black'] font-black leading-[normal] relative shrink-0 text-[16px] text-white whitespace-nowrap" data-node-id="4:90">START AR SCANNER</p>
            </div>
            <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="4:91" data-name="team-slider-section">
              <p className="[word-break:break-word] font-['Unbounded:Bold'] font-bold leading-[normal] relative shrink-0 text-[#9090a8] text-[12px] whitespace-nowrap" data-node-id="4:92">AL TEAM CHANNELS</p>
              <div className="content-stretch flex gap-[14px] items-start overflow-clip relative shrink-0 w-full" data-node-id="4:93" data-name="badge-row">
                <!-- badge-NYY (activo) -->
                <div className="content-stretch flex flex-col gap-[6px] items-center relative shrink-0" data-node-id="4:94" data-name="badge-NYY">
                  <div className="bg-[#141420] border-2 border-[#f72585] border-solid content-stretch flex flex-col items-center justify-center relative rounded-[32px] shrink-0 size-[64px]" data-node-id="4:95" data-name="badge-border">
                    <div className="relative rounded-[24px] shrink-0 size-[48px]" data-node-id="4:96" data-name="team-logo-img"><img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[24px] size-full" src={imgTeamLogoImg} /></div>
                  </div>
                  <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[normal] not-italic relative shrink-0 text-[11px] text-white whitespace-nowrap" data-node-id="4:97">NYY</p>
                </div>
                <!-- badge-BOS / HOU / TOR / BAL: igual pero border-[rgba(255,255,255,0.08)] y etiqueta text-[#9090a8]; imágenes imgTeamLogoImg1..4 -->
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="4:114" data-name="bottom-nav-area">
          <div className="bg-[#141420] border-[rgba(255,255,255,0.08)] border-solid border-t content-stretch flex h-[72px] items-center justify-between px-[16px] relative shrink-0 w-full" data-node-id="4:115" data-name="tab-bar">
            <!-- tab-home (activo): icono 22px + Inter Bold 10 blanco -->
            <div className="content-stretch flex flex-col gap-[4px] h-full items-center justify-center relative shrink-0 w-[64px]" data-node-id="4:116" data-name="tab-home">
              <div className="relative shrink-0 size-[22px]" data-node-id="4:425" data-name="home"><img alt="" className="absolute block inset-0 max-w-none size-full" src={imgHome} /></div>
              <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[normal] not-italic relative shrink-0 text-[10px] text-white whitespace-nowrap" data-node-id="4:118">Home</p>
            </div>
            <!-- tab-videos (play-circle), tab-scanner (aperture), tab-collection (layers) "TCG Vault", tab-game (gamepad): Inter Medium 10 #9090a8 -->
          </div>
          <div className="content-stretch flex items-start justify-center pb-[8px] pt-[12px] relative shrink-0 w-full" data-node-id="4:131" data-name="home-indicator">
            <div className="bg-white h-[5px] opacity-50 relative rounded-[100px] shrink-0 w-[134px]" data-node-id="4:132" data-name="indicator-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
```
