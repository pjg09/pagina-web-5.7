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

No hay tests ni linter configurado. El deploy ocurre en Vercel automáticamente al pushear a `main`.

**CI: release automático por commit prefix.** `.github/workflows/release.yml` corre `semantic-release` en cada push a `main` (ver `.releaserc.json`). El prefijo del commit determina el bump de versión: `fix:`→patch, `feat:`→minor, `chore:`/`docs:`→patch, `BREAKING CHANGE`→major. Genera automáticamente un commit `chore(release): X.X.X [skip ci]` + entrada en `CHANGELOG.md` — no son commits manuales, no los repitas ni los reviertas.

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
  decisiones-arquitectura.md          (ADR-1 a ADR-4: por qué Astro estático, Apps Script, token UUID, Wompi)
  flujo-pago-artistas.md              (diagrama del flujo de pago — desactualizado, pendiente revisión)
  implementacion-flujo-pago-artistas.md  (guía de implementación — pendiente)
  flujo-agendamiento-empresas.md      (plan vivo del flujo empresas sin pago — Calendly embed, notificación al equipo por confirmar)
```

**Componentes existentes (no usar sin leer su CSS primero):**
- `Header.astro` — navegación fija con clase `scrolled` al hacer scroll, menú mobile con `aria-*`
- `Footer.astro` — pie de página global
- `Hero.astro` — componente hero (las páginas actuales definen su hero inline, no lo usan)
- `ServiceCard.astro` — card de servicio reutilizable (las páginas actuales tampoco lo usan)

**Flujo de datos:**
- `src/data/constantes.ts` — fuente única de verdad para todas las URLs externas (WhatsApp, Calendly, Wompi, Apps Script webhook) y textos/precios globales. Cualquier URL que salga del sitio vive aquí.
- `src/data/servicios.ts` — datos de servicios (pendiente). Mismo patrón: los componentes solo presentan, no tienen datos hardcodeados.
- `src/layouts/BaseLayout.astro` — layout base con SEO (canonical, OG, Twitter Card), GA4, y el observer de scroll reveal. Todas las páginas lo usan.

**Por qué este patrón:** cuando se integre un CMS headless (Contentful o Sanity, evaluado post-lanzamiento), `constantes.ts` y `servicios.ts` se reemplazan por llamadas a API sin tocar los componentes.

**Integraciones externas (fuera del repo):**
- **Google Apps Script** — Web App propio (`doPost`) para notificaciones al equipo. Recibe webhooks de Wompi, del formulario `/formulario`, y de Calendly, diferenciados por parámetro `?origen=`. Cruza datos por token UUID y consolida en Google Sheets. Corre en la misma cuenta de Google que el Sheets — sin credenciales adicionales, pero sin conectores no-code (el JSON de cada webhook se parsea a mano).
- **Calendly** — agendamientos. Recibe `utm_content=TRANSACTION_ID` para correlación con el pago.
- **Wompi** — único procesador de pago (pasarela colombiana). El flujo real usa **token UUID generado por Apps Script** (`Utilities.getUuid()`), no `payment_id` crudo. Ver `docs/flujo-pago-artistas.md` para el diagrama completo.

## Sistema de diseño

Todo en `src/styles/global.css` como variables CSS en `:root`. No usar valores mágicos en componentes — referenciar las variables.

| Token | Valor |
|---|---|
| `--bg-base` | `#050508` |
| `--bg-surface` | `#0e0e1a` |
| `--cyan` | `#00c2ff` |
| `--magenta` | `#d400ff` |
| `--font-display` | Bebas Neue |
| `--font-body` | Barlow |

### Variables de color — sección empresas
Agregadas a `global.css`. Usar siempre estas variables para cards/bordes empresas:

| Token | Valor | Uso |
|---|---|---|
| `--border-card` | `rgba(0, 194, 255, 0.25)` | Legacy — casi sin uso real (1 sola referencia en el repo, no es borde de card). La mayoría de cards ahora usan el patrón de borde gradiente `::before` (ver Gotchas técnicos) |
| `--empresa` | `#b5005f` | Color principal empresas (hover + texto) |
| `--empresa-dim` | `rgba(181, 0, 95, 0.35)` | Borde sólido — sobrevive solo en `.sol-item` (variante sin fondo, 4B/4D empresas). Las cards con fondo (`sol-item--card`, `sb-c-card`, etc.) ya no usan borde sólido |
| `--empresa-subtle` | `rgba(181, 0, 95, 0.1)` | Fondo sutil badge empresa |
| `--empresa-hover` | `rgba(224, 0, 79, 0.18)` | Fondo hover badge empresa |

**Clases utilitarias clave:** `.display`, `.display--xl/lg/md/sm`, `.btn`, `.btn--primary/outline/ghost`, `.label`, `.divider`, `.reveal`, `.reveal-delay-1/2/3/4`, `.gradient-text`, `.section-line`, `.container`, `.frase-destacada` (frase en cursiva blanca, tamaño unificado — usada en index/empresas/artistas/seguridad-movilidad, no duplicar su CSS por página)

**Variables de texto completas:** `--text-high` (0.95 opacidad), `--text-secondary` (0.9), `--text-dim` (0.7), `--text-muted` (#55556a). `--text-mid` NO existe — no usarla.

**Scroll reveal:** agregar clase `.reveal` a cualquier elemento para animación de entrada. El observer está en `BaseLayout.astro` y se aplica globalmente. Usar `.reveal-delay-N` para escalonar elementos.

**Gradient text:** `.gradient-text` usa gradiente cyan → azul → rojo. El gradiente original cyan→magenta está comentado en el CSS.

## Convenciones de componentes

- Los componentes solo presentan — sin lógica de negocio ni datos hardcodeados.
- Cada página define su hero **inline** (no como componente separado). Patrón estándar: `section.hero` con `.hero__bg` (img + overlay), `.hero__content` (container con título + subtítulo + CTAs) y `.hero__scroll`.
- `CTAWhatsApp.astro` acepta props `label` y `variant`; aparece en todas las páginas. Requiere import explícito en el frontmatter de cada página: `import CTAWhatsApp from "../components/CTAWhatsApp.astro"`.
- **CTAWhatsApp siempre renderiza blanco:** su CSS interno pisa ambas variantes. Para normalizar tamaño en contexto (ej. hero junto a otro `.btn`), usar `.parent :global(.cta-whatsapp) { font-size: 1.1rem; padding: 0.85rem 2rem; }`. Para igualar ancho en mobile stacked: `width: 100%; justify-content: center` en el mismo selector `:global` dentro de un `@media`.
- **Replicar la estética de CTAWhatsApp fuera del componente:** si una página necesita un botón con apariencia de WhatsApp pero no puede usar `CTAWhatsApp.astro` directamente (ej. tarjetas con foto + CTA propio en `contacto.astro`), copiar el SVG exacto del componente (`fill="currentColor"`) en vez de un ícono verde de WhatsApp — el ícono verde rompe la estética monocromática del sitio.
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
- `constantes.ts` — reemplazar URLs placeholder de Calendly, Wompi (`WOMPI_ASESORIA_ARTISTAS`) y Apps Script (`APPSCRIPT_WEBHOOK_FORMULARIO`)

## Patrones CSS críticos

**Botones del sitio (patrón base):** El patrón global usa fondo blanco + texto negro + hover con gradiente `var(--cyan) → var(--magenta)` y borde cyan. **artistas.astro usa una variante:** `.servicio-btn` y `.asesoria-paso__btn` tienen gradiente cyan→magenta como estado **default** y `filter: brightness(1.2)` en hover. NO usar `btn--primary`/`btn--outline` en páginas — esas clases se overridean con CSS scoped. `CTAWhatsApp.astro` tiene su propio CSS inline.

**Posicionamiento horizontal en hero:** NO usar `grid-column: N` dentro de `.container` para ubicar el bloque de texto. Usar `display: flex; flex-direction: column; align-items: flex-end` en `.hero__content` y `max-width: 50%` en `.hero__text` para empujar a la derecha (o `align-items: flex-start` + `max-width: 55%; margin-left: 8%` para izquierda, como en artistas).

**`object-position` para imágenes con zona oscura:** si la imagen tiene un área oscura en un lado (para texto encima), anclar `object-position` a ESE lado (`right center` si la zona oscura es derecha). Con `object-fit: cover`, el recorte ocurrirá por el lado opuesto preservando siempre la zona de legibilidad. `HeroSeguridad.jpeg` tiene esa zona oscura natural a la derecha.

**Colores de borde por tipo de card:**
- Patrón vigente para la mayoría de cards (index, empresas 4C/4E, artistas 4C/4E): borde gradiente difuminado `::before` con `isolation: isolate` — ver Gotchas técnicos.
- Borde sólido (legacy) sobrevive solo en `.sol-item` sin fondo (4B/4D empresas): `var(--empresa-dim)` → hover `var(--empresa)`.

**Escala tipográfica responsive (convención):** Body text: `clamp(B×1.15, vw, B×1.30)` (+15% mobile, +30% desktop). Subtítulos: `clamp(B×1.10, vw, B×1.20)`. El vw ≈ `desktop_rem / 0.75` para que el máximo se alcance a ~1200px. Las clases globales `.body--lg/md/sm`, `.display--md/sm`, `.label` ya aplican estos valores — páginas futuras deben usarlas en vez de hardcodear `font-size`.

**Instancia concreta ya en uso para contenido informativo:** `clamp(1.58rem, 2.4vw, 1.78rem)` — aplicado a párrafos/descripciones/`<li>` en empresas.astro, artistas.astro y seguridad-movilidad.astro. Reusar este valor exacto al "matchear" tamaños entre páginas en vez de re-derivarlo.

**Cards de igual altura en grid de 2 columnas:** Añadir `flex: 1` a la card dentro de un outer wrapper con `display: flex; flex-direction: column`. El grid ya aplica `align-items: stretch` al outer por defecto; sin `flex: 1` la card no crece para llenarlo.

**Patrón "header con foto y borde lateral" (`asesoria-header`/`diagnostico-header`):** Grid `55% 45%` (texto | foto), `min-height: 80vh`. Columna texto en `--bg-surface`; columna foto con `__border` — barra vertical 6px, `linear-gradient(to bottom, var(--cyan), var(--magenta))`, `opacity: 0.25`, `filter: blur(1px)`. Mobile (`≤900px`): 1 columna, foto `aspect-ratio: 16/9`. Usado en artistas (5A) y empresas (diagnóstico).

**Patrón "banda de datos con divisor degradado" (`asesoria-pricing`/`diagnostico-info`):** Grid `1fr auto 1fr` (+ `auto 1fr` por columna extra), divisor vertical `2px × 110px` con `linear-gradient(to bottom, var(--cyan), var(--magenta))`. Mobile (`≤900px`): grid a 1 columna + `justify-items: center`, divisor horizontal `160px × 2px` con `linear-gradient(90deg, ...)`. Usado en artistas (pricing) y empresas (diagnóstico).

## Gotchas técnicos

**`::before` borde gradiente + clase `.reveal` — stacking context bug:** Cuando un wrapper usa `::before { position: absolute; z-index: -1 }` para un borde de gradiente, poner `.reveal` en el WRAPPER EXTERNO, no en la card interior. Si `.reveal` está en la card interior, su `opacity: 0 → 1` crea un stacking context que hace que el gradiente se vea a través de la card semi-transparente durante la animación. Patrón de referencia: `.problema-card-outer` en `index.astro` (el `.reveal` está en el outer, la `.problema-card` interior no tiene `.reveal`).

**`z-index: -1` NO va detrás del background del propio elemento padre:** Un `::before { z-index: -1 }` dentro de `isolation: isolate` pinta en el paso 2 del stacking order — DESPUÉS del paso 1 (background del propio elemento). El gradiente aparece ENCIMA del fondo oscuro de la card, no detrás. Fix: poner `::before` en un div WRAPPER SIN background; la card interior (con su `background: var(--bg-card)` opaco) actúa como máscara cubriendo el centro del gradiente. Solo funciona si el wrapper no tiene background propio.

**`transform` + `.reveal` conflict (producción vs dev):** El bundle CSS en producción puede ordenar `.reveal.visible { transform: translateY(0) }` DESPUÉS del scoped CSS del componente, pisando transforms custom. Fix: añadir selector de mayor especificidad `.parent .element.visible { transform: <valor-original> }` para forzar que gane el scoped CSS.

**Linter reformatea entre operaciones:** El formatter de Astro reindenta el HTML después de cada save. Si el Edit tool falla con "old_string not found", usar Python `content.replace(old, new)` via Bash — es inmune a cambios de indentación. Para cambios masivos de CSS (múltiples valores en distintas clases), usar un script Python que haga todos los replaces de una sola pasada en lugar de múltiples operaciones Edit.

**`.btn--primary` / `.btn--outline` en Astro scoped CSS:** Los overrides de clases globales en `<style>` de una página solo afectan elementos de ESA página, no los de componentes hijos (como `CTAWhatsApp.astro`). Para cambiar el estilo del botón en un componente hijo, modificar el CSS del componente directamente.

**`CTAWhatsApp` conserva el glow de `.btn--primary` aunque se pise su estilo:** la clase default `btn--primary` aporta `box-shadow: var(--cyan-glow)` (`--cyan-glow-strong` en hover). Los overrides `:global(.cta-whatsapp)` no tocan `box-shadow`, así que el resplandor cyan persiste — es el "brillo" característico del CTA de WhatsApp en cierres de página.

**`<br>` en Astro no es confiable para layout:** Los void elements pueden no recibir el atributo de scoping de Astro, y `display: block` en un `<br>` suprime su salto de línea. Para ajustes de alineación vertical (ej. igualar altura de títulos en dos columnas), usar `padding-top` en el elemento afectado en lugar de `<br>` con CSS.

**`<br>` responsive (solo desktop/solo mobile):** No usar `display: none` en `<br>` — suprime el salto. En su lugar, usar `<br class="br-desktop" />` y en CSS: `@media (max-width: 900px) { .br-desktop { display: none; } }`. Mismo patrón con `.br-mobile` para el caso inverso.

**`background-clip: text` + SVG `fill="currentColor"`:** Al aplicar gradiente de texto con `color: transparent`, los íconos SVG que usan `fill="currentColor"` quedan invisibles. Fix: agregar `fill: var(--cyan)` explícito al SVG via `:global(.componente svg)`.

**`CTAWhatsApp.astro` pierde su ícono en `:hover`:** el propio `:hover` del componente aplica `color: transparent`, por lo que el SVG `fill="currentColor"` desaparece al pasar el mouse, incluso si la página no define ningún override. Fix: `.seccion :global(.cta-whatsapp:hover svg) { fill: var(--cyan); }`.

**`background-clip: text` + `display: block` → agregar `width: fit-content`:** Al aplicar gradiente de texto a un elemento `display: block`, el elemento ocupa el ancho completo del contenedor y el texto corto (ej. "01") solo muestra el primer color del gradiente. Fix: añadir `width: fit-content` para restringir el gradiente al ancho del texto.

**Imagen full-bleed en sección con layout de columnas:** Para que una imagen ocupe toda una columna sin padding del `.container`, sacar la imagen del `.container` y convertir el elemento padre de la sección directamente en el grid. La columna de contenido gestiona su propio padding interno calculado para alinearse con el container.

**Grid de dos columnas imagen+servicios — orden HTML y dirección:** Con `grid-template-columns: 1fr 460px` (imagen derecha), el HTML debe ir servicios primero, imagen después. Con `--reverse` (`460px 1fr`, imagen izquierda), imagen primero. Cambiar de `--reverse` a normal requiere también invertir el orden HTML, no solo quitar la clase. En mobile (`≤900px`), `.sol-cat__imagen` siempre recibe `order: -1` (imagen primero) sin importar `--reverse` ni el orden HTML — el orden mobile es independiente del desktop.

**Bebas Neue solo carga en peso 400:** La importación `family=Bebas+Neue` de Google Fonts trae únicamente regular. Los `h2` generan bold sintético (más grueso) por el `font-weight: 700` del navegador. Para igualar visualmente un `<p>` a un `<h2>` con Bebas Neue, agregar `font-weight: 700` explícito al `<p>`.

**`flex: 1` no iguala anchos en contenedores shrink-to-fit:** Si el padre no tiene ancho definido (auto), `flex:1` no tiene espacio extra que repartir y cada item conserva su ancho de contenido — no iguala nada. Para forzar el mismo ancho en botones/items vecinos, medir el ancho real (Playwright) y usar `min-width` explícito igual en ambos.

**CSS "muerto" tras renombrar una clase en el HTML:** Antes de editar una regla CSS por nombre de clase, `grep` el HTML para confirmar que esa clase sigue usándose — una edición previa pudo haber cambiado la clase del elemento (ej. `.proposito__rule` → `.divider`) sin borrar la regla vieja, que queda huérfana y cualquier cambio sobre ella no tiene efecto visible.

**Tinte `rgba` se lava sobre gradiente/blur detrás:** Un fondo de baja opacidad (ej. `var(--cyan-dim)`) pensado para verse sobre `--bg-base` se mezcla con cualquier `::before` con blur que quede detrás (como el borde glow), perdiendo su color. Fix: `background: linear-gradient(var(--tinte), var(--tinte)), var(--bg-base);` — la segunda capa actúa de base opaca fija.

**Espaciado "simétrico arriba/abajo" ≠ igualar solo el margin del bloque:** si el bloque es vecino de una sección que también aporta padding (ej. `padding-top` de la siguiente sección o `padding-bottom` de la contenedora), ese padding se suma de un solo lado y rompe la simetría aunque el margin sea idéntico en ambos lados. Hay que poner a 0 los paddings vecinos que compitan y dejar un solo valor al mando (visto en `.id-frase` de index.astro y `.problema__cierre` de seguridad-movilidad.astro).

**Comentario CSS cerrado con `-->` en vez de `*/`:** error de copy-paste desde HTML. El parser no encuentra el cierre y trata todo como comentario hasta el PRÓXIMO `*/` real del archivo, tragándose reglas completas sin error visible (fondo no aplica, tipografía cae a serif por defecto). Si una página/demo no aplica ningún estilo, contar `/*` vs `*/` en el `<style>`.

**Divisor de acento vía `gap` + background del grid (sin pseudo-elemento):** en un grid de 2 columnas con `gap: 6px`, poner el gradiente cyan→magenta como `background` del propio contenedor — el gap deja ver una franja fina de ese fondo entre las columnas opacas. Mobile: cambiar a `linear-gradient(90deg, ...)` para que la franja (ahora horizontal, en el row-gap) se vea como degradado izquierda→derecha. Usado en `.problema__split` de seguridad-movilidad.astro.

**`.btn` global tiene `white-space: nowrap` (global.css:168):** botones con texto largo (ej. "Solicitar asesoría estratégica") provocan overflow horizontal en mobile. Fix: override puntual `white-space: normal` en la página que lo necesite — no tocar la clase global porque otros usos cortos dependen del nowrap.

## Estado actual de páginas

- `artistas.astro` — completa (secciones 1–5): hero, intro, etapas, servicios (4 categorías con imágenes), asesoría estratégica con formulario ilustrativo.
- `empresas.astro` — completa (secciones 1–6): hero, propósito, problema (dos columnas título|lista + mensaje cierre), soluciones (4A header con imagen full-bleed; 01 sin imagen; 02 imagen derecha; 03 tres columnas; 04 imagen izquierda), diagnóstico, cierre.
- `index.astro` — completa (secciones 1–6).
- `agendamientos.astro` — completa (secciones 1–4): hero (variante del de index sin botones), dos agenda-cards comparativas (Empresas/Artistas) con CTA a sub-rutas de agendamiento, asesoría estratégica (layout 5A/5B de artistas.astro), cierre "no estás seguro" con CTAWhatsApp.
- `contacto.astro` — completa (secciones 1–2): redes/email + dos tarjetas de representantes (WhatsApp Jessmar/Adrián con foto y CTA), formulario de contacto de 7 campos con validación cliente (botón disabled hasta llenar todo + regex de email) — **sin conexión a backend todavía, eso queda para una sesión futura**.
- `formulario.astro`, `resumen.astro` — pendientes de diseño.
- `seguridad-movilidad.astro` — en construcción (secciones 1–3): hero con imagen, propósito (texto centrado), problema (layout asimétrico imagen/lista 50%/50% con divisor de acento entre columnas — ya no replica el grid simple de empresas.astro sección 3 + cierre con frase destacada).

## Perfil del desarrollador

Experiencia sólida en backend y arquitectura limpia. Experiencia limitada en frontend (HTML/CSS/JS vanilla). Primera vez con Astro. Prefiere explicaciones que conecten patrones frontend con análogos backend cuando corresponda.
