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
npm run dev       # servidor local en localhost:4321
npm run build     # build estático en dist/
npm run preview   # preview del build en local
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
- **MercadoPago** — único procesador de pago al lanzamiento. `back_url` redirige a `/formulario?payment_id=ID` tras el pago.

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

**Clases utilitarias clave:** `.display`, `.display--xl/lg/md/sm`, `.btn`, `.btn--primary/outline/ghost`, `.label`, `.divider`, `.reveal`, `.reveal-delay-1/2/3/4`, `.gradient-text`, `.section-line`, `.container`

**Scroll reveal:** agregar clase `.reveal` a cualquier elemento para animación de entrada. El observer está en `BaseLayout.astro` y se aplica globalmente. Usar `.reveal-delay-N` para escalonar elementos.

**Gradient text:** `.gradient-text` usa gradiente cyan → azul → rojo. El gradiente original cyan→magenta está comentado en el CSS.

## Convenciones de componentes

- Los componentes solo presentan — sin lógica de negocio ni datos hardcodeados.
- Cada página tiene su propio `Hero.astro` parametrizable.
- `CTAWhatsApp.astro` acepta props `label` y `variant`; aparece en todas las páginas.
- El header agrega clase `scrolled` (fondo blur) al hacer scroll, y maneja menú mobile con atributos `aria-*` correctos.

## Diseño responsive

Mobile-first. Todo cambio de layout se piensa primero en mobile y escala a desktop. Breakpoint principal: `max-width: 768px`.

## TODOs bloqueantes antes de producción

Están marcados como comentarios `// TODO:` en el código:
- `BaseLayout.astro` — reemplazar `G-XXXXXXXXXX` con el ID real de GA4
- `constantes.ts` — reemplazar URLs placeholder de Calendly, MercadoPago y Make webhook
- `astro.config.mjs` — reemplazar `site` con el dominio real de producción

## Perfil del desarrollador

Experiencia sólida en backend y arquitectura limpia. Experiencia limitada en frontend (HTML/CSS/JS vanilla). Primera vez con Astro. Prefiere explicaciones que conecten patrones frontend con análogos backend cuando corresponda.
