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

**Scroll reveal:** agregar clase `.reveal` a cualquier elemento para animación de entrada. El observer está en `BaseLayout.astro` y se aplica globalmente. Usar `.reveal-delay-N` para escalonar elementos.

**Gradient text:** `.gradient-text` usa gradiente cyan → azul → rojo. El gradiente original cyan→magenta está comentado en el CSS.

## Convenciones de componentes

- Los componentes solo presentan — sin lógica de negocio ni datos hardcodeados.
- Cada página define su hero **inline** (no como componente separado). Patrón estándar: `section.hero` con `.hero__bg` (img + overlay), `.hero__content` (container con título + subtítulo + CTAs) y `.hero__scroll`.
- `CTAWhatsApp.astro` acepta props `label` y `variant`; aparece en todas las páginas.
- El header agrega clase `scrolled` (fondo blur) al hacer scroll, y maneja menú mobile con atributos `aria-*` correctos.

## Diseño responsive

Mobile-first. Todo cambio de layout se piensa primero en mobile y escala a desktop. Breakpoints: `max-width: 768px` (mobile) y `max-width: 900px` (tablet / layouts de dos columnas).

## TODOs bloqueantes antes de producción

Están marcados como comentarios `// TODO:` en el código:
- `BaseLayout.astro` — reemplazar `G-XXXXXXXXXX` con el ID real de GA4
- `constantes.ts` — reemplazar URLs placeholder de Calendly, MercadoPago y Make webhook
- `astro.config.mjs` — reemplazar `site` con el dominio real de producción

## Patrones CSS críticos

**Botones del sitio (patrón establecido):** Todos los botones de contenido usan fondo blanco + texto negro + hover con gradiente `var(--cyan) → var(--magenta)` y borde cyan. NO usar `btn--primary`/`btn--outline` en páginas — esas clases se overridean con CSS scoped. `CTAWhatsApp.astro` tiene su propio CSS inline.

**Colores de borde por tipo de card:**
- Cards artistas / lado derecho: `rgba(0,194,255,0.25)` → hover `var(--cyan)`
- Cards empresas / lado izquierdo: `var(--empresa-dim)` → hover `var(--empresa)`

## Imágenes disponibles en public/images/

- `HeroIndex.jpeg`, `HeroArtistas.jpeg`, `HeroEmpresas.jpg` — heroes por página
- `InternaEmpresas01–05.jpeg` — imágenes para secciones internas de empresas
- `InternaArtistas01–04.jpeg` — imágenes para secciones internas de artistas
- Íconos de servicios empresas: `PaginaWeb.png`, `LandingPage.png`, `BioLink.png`, `GoogleProfile.png`, `WhatsappBusiness.png`, `PortafolioDigital.png`, `AuditoriaDigital.png`, `AdministrarRedes.png`, `PautaPublicitaria.png`

## Gotchas técnicos

**`transform` + `.reveal` conflict (producción vs dev):** El bundle CSS en producción puede ordenar `.reveal.visible { transform: translateY(0) }` DESPUÉS del scoped CSS del componente, pisando transforms custom. Fix: añadir selector de mayor especificidad `.parent .element.visible { transform: <valor-original> }` para forzar que gane el scoped CSS.

**Linter reformatea entre operaciones:** El formatter de Astro reindenta el HTML después de cada save. Si el Edit tool falla con "old_string not found", usar Python `content.replace(old, new)` via Bash — es inmune a cambios de indentación.

**`.btn--primary` / `.btn--outline` en Astro scoped CSS:** Los overrides de clases globales en `<style>` de una página solo afectan elementos de ESA página, no los de componentes hijos (como `CTAWhatsApp.astro`). Para cambiar el estilo del botón en un componente hijo, modificar el CSS del componente directamente.

## Estado actual de páginas

- `artistas.astro` — completa (secciones 1–5): hero, intro, etapas, servicios (4 categorías con imágenes), asesoría estratégica con formulario ilustrativo.
- `empresas.astro` — completa (secciones 1–6): hero, propósito, problema, soluciones (4 categorías con imágenes), diagnóstico, cierre.
- `index.astro` — completa (secciones 1–6).
- `formulario.astro`, `resumen.astro`, `agendamientos.astro`, `contacto.astro` — pendientes de diseño.

## Perfil del desarrollador

Experiencia sólida en backend y arquitectura limpia. Experiencia limitada en frontend (HTML/CSS/JS vanilla). Primera vez con Astro. Prefiere explicaciones que conecten patrones frontend con análogos backend cuando corresponda.
