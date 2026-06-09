# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comportamiento esperado

Reta la forma de pensar del desarrollador, no la valides. Cuando se proponga un plan o decisión técnica:
- Señala fallas, casos límite y puntos ciegos
- Discrepa cuando la lógica sea débil o haya suposiciones sin sustento
- Di directamente cuando algo es mala idea, en lugar de hacerla funcionar igual

No se necesita ánimo ni positividad. Se necesita pensamiento crítico y correcciones directas.

## Comandos

```bash
pnpm dev          # servidor local en localhost:4321
pnpm build        # build estático en dist/
pnpm preview      # preview del build en local
```

No hay tests, linter configurado, ni CI propio. El deploy ocurre en Vercel automáticamente al pushear a `main`.

## Arquitectura

Sitio estático con Astro. Sin backend propio, sin base de datos. Decisión consciente para este momento del negocio.

**Estructura:**
```
src/
  components/   CTAWhatsApp, Header, Footer, Hero, ServiceCard
  data/         constantes.ts (URLs externas), servicios.ts (pendiente)
  layouts/      BaseLayout.astro
  pages/        index, artistas, empresas, formulario, resumen, agendamientos, contacto, seguridad-movilidad
  styles/       global.css
docs/
  decisiones-arquitectura.md          (ADR-1 a ADR-4: por qué Astro estático, Make, token UUID, MercadoPago)
  flujo-pago-artistas.md              (diagrama del flujo de pago — desactualizado, pendiente revisión)
  implementacion-flujo-pago-artistas.md  (guía de implementación — pendiente)
```

**Componentes existentes (no usar sin leer su CSS primero):**
- `Header.astro` — navegación fija con clase `scrolled` al hacer scroll, menú mobile con `aria-*`
- `Footer.astro` — pie de página global
- `Hero.astro` — componente hero (las páginas actuales definen su hero inline, no lo usan)
- `ServiceCard.astro` — card de servicio reutilizable (las páginas actuales tampoco lo usan)

**Flujo de datos:**
- `src/data/constantes.ts` — fuente única de verdad para todas las URLs externas (WhatsApp, Calendly, MercadoPago, Make webhook) y textos/precios globales. Cualquier URL que salga del sitio vive aquí.
- `src/data/servicios.ts` — datos de servicios (pendiente). Mismo patrón: los componentes solo presentan, no tienen datos hardcodeados.
- `src/layouts/BaseLayout.astro` — layout base con SEO (canonical, OG, Twitter Card), GA4, y el observer de scroll reveal. Todas las páginas lo usan.

**Por qué este patrón:** cuando se integre un CMS headless (Contentful o Sanity, evaluado post-lanzamiento), `constantes.ts` y `servicios.ts` se reemplazan por llamadas a API sin tocar los componentes.

**Integraciones externas (fuera del repo):**
- **Make** — middleware para notificaciones al equipo. Escucha webhooks de MercadoPago, del formulario `/formulario`, y de Calendly. Cruza datos por `payment_id` y consolida en Google Sheets. Las credenciales viven en Make, no en el repo.
- **Calendly** — agendamientos. Recibe `utm_content=TRANSACTION_ID` para correlación con el pago.
- **MercadoPago** — único procesador de pago al lanzamiento (Stripe evaluado post-lanzamiento para clientes internacionales). El flujo real usa **token UUID generado por Make**, no `payment_id` crudo. Ver `docs/flujo-pago-artistas.md` para el diagrama completo.

## Sistema de diseño

Todo en `src/styles/global.css` como variables CSS en `:root`. No usar valores mágicos en componentes — referenciar las variables.

| Token | Valor |
|---|---|
| `--bg-base` | `#080810` |
| `--bg-surface` | `#0e0e1a` |
| `--cyan` | `#00c2ff` |
| `--magenta` | `#d400ff` |
| `--font-display` | Bebas Neue |
| `--font-body` | Barlow |

### Variables de color — sección empresas
Agregadas a `global.css`. Usar siempre estas variables para cards/bordes empresas:

| Token | Valor | Uso |
|---|---|---|
| `--border-card` | `rgba(0, 194, 255, 0.25)` | Borde default de todas las cards |
| `--empresa` | `#b5005f` | Color principal empresas (hover + texto) |
| `--empresa-dim` | `rgba(181, 0, 95, 0.35)` | Borde default cards empresa |
| `--empresa-subtle` | `rgba(181, 0, 95, 0.1)` | Fondo sutil badge empresa |
| `--empresa-hover` | `rgba(224, 0, 79, 0.18)` | Fondo hover badge empresa |

**Clases utilitarias clave:** `.display`, `.display--xl/lg/md/sm`, `.btn`, `.btn--primary/outline/ghost`, `.label`, `.divider`, `.reveal`, `.reveal-delay-1/2/3/4`, `.gradient-text`, `.section-line`, `.container`

**Variables de texto completas:** `--text-high` (0.95 opacidad), `--text-secondary` (0.9), `--text-dim` (0.7), `--text-muted` (#55556a). `--text-mid` NO existe — no usarla.

**Scroll reveal:** agregar clase `.reveal` a cualquier elemento para animación de entrada. El observer está en `BaseLayout.astro` y se aplica globalmente. Usar `.reveal-delay-N` para escalonar elementos.

**Gradient text:** `.gradient-text` usa gradiente cyan → azul → rojo. El gradiente original cyan→magenta está comentado en el CSS.

## Convenciones de componentes

- Los componentes solo presentan — sin lógica de negocio ni datos hardcodeados.
- Cada página define su hero **inline** (no como componente separado). Patrón estándar: `section.hero` con `.hero__bg` (img + overlay), `.hero__content` (container con título + subtítulo + CTAs) y `.hero__scroll`.
- `CTAWhatsApp.astro` acepta props `label` y `variant`; aparece en todas las páginas. Requiere import explícito en el frontmatter de cada página: `import CTAWhatsApp from "../components/CTAWhatsApp.astro"`.
- **CTAWhatsApp siempre renderiza blanco:** su CSS interno pisa ambas variantes. Para normalizar tamaño en contexto (ej. hero junto a otro `.btn`), usar `.parent :global(.cta-whatsapp) { font-size: 1.1rem; padding: 0.85rem 2rem; }`. Para igualar ancho en mobile stacked: `width: 100%; justify-content: center` en el mismo selector `:global` dentro de un `@media`.
- El header agrega clase `scrolled` (fondo blur) al hacer scroll, y maneja menú mobile con atributos `aria-*` correctos.

**Patrón item de servicio con icono (`.sb-b-item__header`):** Estándar en todas las secciones de servicios de artistas y empresas:
```html
<div class="sb-b-item__header">
  <img src="/images/Icono.png" alt="" class="sb-b-item__icono" aria-hidden="true" />
  <span class="servicio-item__nombre">Título en<br />dos líneas</span>
</div>
```
CSS: `grid-template-columns: 44px 1fr; align-items: center; column-gap: 0.85rem`. Icono siempre 44×44px.

## Diseño responsive

Mobile-first. Todo cambio de layout se piensa primero en mobile y escala a desktop. Breakpoints: `max-width: 768px` (mobile) y `max-width: 900px` (tablet / layouts de dos columnas).

## TODOs bloqueantes antes de producción

Están marcados como comentarios `// TODO:` en el código:
- `BaseLayout.astro` — reemplazar `G-XXXXXXXXXX` con el ID real de GA4
- `constantes.ts` — reemplazar URLs placeholder de Calendly, MercadoPago y Make webhook
- `astro.config.mjs` — reemplazar `site` con el dominio real de producción

## Patrones CSS críticos

**Botones del sitio (patrón base):** El patrón global usa fondo blanco + texto negro + hover con gradiente `var(--cyan) → var(--magenta)` y borde cyan. **artistas.astro usa una variante:** `.servicio-btn` y `.asesoria-paso__btn` tienen gradiente cyan→magenta como estado **default** y `filter: brightness(1.2)` en hover. NO usar `btn--primary`/`btn--outline` en páginas — esas clases se overridean con CSS scoped. `CTAWhatsApp.astro` tiene su propio CSS inline.

**Posicionamiento horizontal en hero:** NO usar `grid-column: N` dentro de `.container` para ubicar el bloque de texto. Usar `display: flex; flex-direction: column; align-items: flex-end` en `.hero__content` y `max-width: 50%` en `.hero__text` para empujar a la derecha (o `align-items: flex-start` + `max-width: 55%; margin-left: 8%` para izquierda, como en artistas).

**`object-position` para imágenes con zona oscura:** si la imagen tiene un área oscura en un lado (para texto encima), anclar `object-position` a ESE lado (`right center` si la zona oscura es derecha). Con `object-fit: cover`, el recorte ocurrirá por el lado opuesto preservando siempre la zona de legibilidad.

**Colores de borde por tipo de card:**
- Cards artistas / lado derecho: `rgba(0,194,255,0.25)` → hover `var(--cyan)`
- Cards empresas / lado izquierdo: `var(--empresa-dim)` → hover `var(--empresa)`

**Escala tipográfica responsive (convención):** Body text: `clamp(B×1.15, vw, B×1.30)` (+15% mobile, +30% desktop). Subtítulos: `clamp(B×1.10, vw, B×1.20)`. El vw ≈ `desktop_rem / 0.75` para que el máximo se alcance a ~1200px. Las clases globales `.body--lg/md/sm`, `.display--md/sm`, `.label` ya aplican estos valores — páginas futuras deben usarlas en vez de hardcodear `font-size`.

**Cards de igual altura en grid de 2 columnas:** Añadir `flex: 1` a la card dentro de un outer wrapper con `display: flex; flex-direction: column`. El grid ya aplica `align-items: stretch` al outer por defecto; sin `flex: 1` la card no crece para llenarlo.

## Imágenes disponibles en public/images/

- `HeroIndex.jpeg`, `HeroArtistas.jpeg`, `HeroEmpresas.jpg`, `HeroSeguridad.jpeg` — heroes por página (`HeroSeguridad.jpeg` tiene zona oscura natural a la derecha para texto)
- `InternaEmpresas01–05.jpeg` — imágenes para secciones internas de empresas
- `InternaArtistas01–04.jpeg` — imágenes para secciones internas de artistas
- Íconos de servicios empresas: `PaginaWeb.png`, `LandingPage.png`, `BioLink.png`, `GoogleProfile.png`, `WhatsappBusiness.png`, `PortafolioDigital.png`, `AuditoriaDigital.png`, `AdministrarRedes.png`, `PautaPublicitaria.png`
- Íconos etapas artistas: `ArtistasEmergentes.png`, `ArtistasCrecimiento.png`, `EquiposDisqueras.png`
- Íconos servicios artistas: `EstrategiaLanzamiento.png`, `PlaneacionCampanas.png`, `CampanasYoutube.png`, `EstrategiasCrecimiento.png`, `CampanasInfluencers.png`, `PromocionTematicas.png`, `ProduccionVideo.png`, `ProduccionMusical.png`, `Fotografia.png`, `ContenidoVisual.png`, `GiraMedios.png`, `Presentaciones.png`, `Cines.png`
- Imágenes de secciones: `Artistas01–03.jpeg`, `Empresas01–03.jpeg`, `Referencia01.jpeg`, `InternaSeguridad01.jpeg`
- UI: `BotonArtista.png`, `BotonEmpresa.png`, `logo.png`, `LogoFenalco.png`
- Íconos sociales: `Facebook.png`, `Instagram.png`, `Tiktok.png`, `Whatsapp.png`, `Email.png`
- Íconos adicionales artistas: `Colaboraciones.png`, `GestionInfluencers.png`
- Íconos adicionales producción: `VideosCorporativos.png`, `VideosRedes.png`

## Gotchas técnicos

**`transform` + `.reveal` conflict (producción vs dev):** El bundle CSS en producción puede ordenar `.reveal.visible { transform: translateY(0) }` DESPUÉS del scoped CSS del componente, pisando transforms custom. Fix: añadir selector de mayor especificidad `.parent .element.visible { transform: <valor-original> }` para forzar que gane el scoped CSS.

**Linter reformatea entre operaciones:** El formatter de Astro reindenta el HTML después de cada save. Si el Edit tool falla con "old_string not found", usar Python `content.replace(old, new)` via Bash — es inmune a cambios de indentación. Para cambios masivos de CSS (múltiples valores en distintas clases), usar un script Python que haga todos los replaces de una sola pasada en lugar de múltiples operaciones Edit.

**`.btn--primary` / `.btn--outline` en Astro scoped CSS:** Los overrides de clases globales en `<style>` de una página solo afectan elementos de ESA página, no los de componentes hijos (como `CTAWhatsApp.astro`). Para cambiar el estilo del botón en un componente hijo, modificar el CSS del componente directamente.

**`<br>` en Astro no es confiable para layout:** Los void elements pueden no recibir el atributo de scoping de Astro, y `display: block` en un `<br>` suprime su salto de línea. Para ajustes de alineación vertical (ej. igualar altura de títulos en dos columnas), usar `padding-top` en el elemento afectado en lugar de `<br>` con CSS.

**`<br>` responsive (solo desktop/solo mobile):** No usar `display: none` en `<br>` — suprime el salto. En su lugar, usar `<br class="br-desktop" />` y en CSS: `@media (max-width: 900px) { .br-desktop { display: none; } }`. Mismo patrón con `.br-mobile` para el caso inverso.

**`background-clip: text` + SVG `fill="currentColor"`:** Al aplicar gradiente de texto con `color: transparent`, los íconos SVG que usan `fill="currentColor"` quedan invisibles. Fix: agregar `fill: var(--cyan)` explícito al SVG via `:global(.componente svg)`.

**`background-clip: text` + `display: block` → agregar `width: fit-content`:** Al aplicar gradiente de texto a un elemento `display: block`, el elemento ocupa el ancho completo del contenedor y el texto corto (ej. "01") solo muestra el primer color del gradiente. Fix: añadir `width: fit-content` para restringir el gradiente al ancho del texto.

**Imagen full-bleed en sección con layout de columnas:** Para que una imagen ocupe toda una columna sin padding del `.container`, sacar la imagen del `.container` y convertir el elemento padre de la sección directamente en el grid. La columna de contenido gestiona su propio padding interno calculado para alinearse con el container.

**Grid de dos columnas imagen+servicios — orden HTML y dirección:** Con `grid-template-columns: 1fr 460px` (imagen derecha), el HTML debe ir servicios primero, imagen después. Con `--reverse` (`460px 1fr`, imagen izquierda), imagen primero. Cambiar de `--reverse` a normal requiere también invertir el orden HTML, no solo quitar la clase.

**Bebas Neue solo carga en peso 400:** La importación `family=Bebas+Neue` de Google Fonts trae únicamente regular. Los `h2` generan bold sintético (más grueso) por el `font-weight: 700` del navegador. Para igualar visualmente un `<p>` a un `<h2>` con Bebas Neue, agregar `font-weight: 700` explícito al `<p>`.

## Estado actual de páginas

- `artistas.astro` — completa (secciones 1–5): hero, intro, etapas, servicios (4 categorías con imágenes), asesoría estratégica con formulario ilustrativo.
- `empresas.astro` — completa (secciones 1–6): hero, propósito, problema (dos columnas título|lista + mensaje cierre), soluciones (4A header con imagen full-bleed; 01 sin imagen; 02 imagen derecha; 03 tres columnas; 04 imagen izquierda), diagnóstico, cierre.
- `index.astro` — completa (secciones 1–6).
- `formulario.astro`, `resumen.astro`, `agendamientos.astro`, `contacto.astro` — pendientes de diseño.
- `seguridad-movilidad.astro` — en construcción (secciones 1–3): hero con imagen, propósito (texto centrado), problema (grid imagen+lista + cierre gradient). Patrón "problema" reutiliza estructura de empresas.astro sección 3.

## Perfil del desarrollador

Experiencia sólida en backend y arquitectura limpia. Experiencia limitada en frontend (HTML/CSS/JS vanilla). Primera vez con Astro. Prefiere explicaciones que conecten patrones frontend con análogos backend cuando corresponda.
