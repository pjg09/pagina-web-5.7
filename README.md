# 5.7 / Onda Creativa Launch — Sitio Web

Sitio web institucional y de conversión para **5.7 / Onda Creativa Launch**, agencia colombiana de servicios digitales para artistas musicales y empresas/marcas.

---

## Stack tecnológico

| Capa | Herramienta |
|------|-------------|
| Framework | Astro (sitio estático) |
| Hosting | Vercel |
| Agendamientos | Calendly |
| Pagos | MercadoPago (lanzamiento) — Stripe internacional (evaluación futura según volumen) |
| Analytics | Google Analytics 4 |
| Automatización | Make (webhooks MercadoPago + formulario + Calendly → notificaciones al equipo) |
| Email marketing | Brevo o Mailchimp (implementación futura) |
| Gestor de paquetes | pnpm |
| Lenguaje | TypeScript |

> **Nota:** aunque no hay backend propio, Make actúa como middleware externo. Requiere credenciales de Google Sheets y configuración de webhooks. No es infraestructura de código, pero sí es infraestructura operativa que el equipo debe mantener.

---

## Estructura del proyecto

```
pagina-web-5.7/
├── public/                     # Archivos estáticos (imágenes, fuentes, favicon)
├── src/
│   ├── components/             # Componentes reutilizables
│   │   ├── CTAWhatsApp.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   └── ServiceCard.astro
│   ├── data/                   # Datos del sitio separados de los componentes
│   │   ├── constantes.ts       # URLs, teléfonos, links de Calendly, precios, links de MercadoPago
│   │   └── servicios.ts        # Listado de servicios para artistas y empresas
│   ├── layouts/
│   │   └── BaseLayout.astro    # Estructura HTML base heredada por todas las páginas
│   ├── pages/                  # Cada archivo es una ruta del sitio
│   │   ├── index.astro         # /
│   │   ├── empresas.astro      # /empresas
│   │   ├── artistas.astro      # /artistas
│   │   ├── agendamientos.astro # /agendamientos
│   │   ├── formulario.astro    # /formulario — formulario previo al agendamiento de artistas
│   │   ├── contacto.astro      # /contacto
│   │   └── resumen.astro       # /resumen — página post-pago y post-agendamiento
│   └── styles/
│       └── global.css          # Estilos globales
├── astro.config.mjs
├── tsconfig.json
└── pnpm-lock.yaml
```

---

## Páginas

| Ruta | Objetivo |
|------|----------|
| `/` | Explicar qué es 5.7 y segmentar al visitante (artista o empresa) |
| `/empresas` | Convertir empresas en clientes |
| `/artistas` | Convertir artistas en clientes, incluye sección de asesoría con normativas y flujo de pago |
| `/agendamientos` | Dos flujos: asesoría artistas (pago → /formulario → Calendly) y diagnóstico empresas (solo Calendly) |
| `/formulario` | Formulario previo al agendamiento de artistas; recibe `payment_id` por URL param |
| `/contacto` | WhatsApp, correo y redes sociales |
| `/resumen` | Página post-agendamiento: resumen de pago y sesión agendada + CTA WhatsApp al equipo |

---

## Flujo de pago — Asesoría artistas

**Flujo automatizado vía Make. Sin backend propio.**

```
Usuario
  → clic en "Pagar asesoría"
  → link de pago MercadoPago
  → pago completado
  → back_url redirige a /formulario?payment_id=TRANSACTION_ID
  → usuario llena formulario (redes, plataformas, descripción, objetivos)
  → formulario hace POST a webhook de Make con datos + payment_id
  → formulario redirige a Calendly?utm_content=TRANSACTION_ID
  → usuario agenda su sesión en Calendly
  → Calendly redirige a /resumen (con datos de agendamiento en URL params)
  → /resumen muestra: resumen del pago + datos de la sesión agendada + CTA WhatsApp
  → usuario confirma por WhatsApp con el equipo
```

**Notificaciones al equipo vía Make:**

Make escucha tres webhooks y correlaciona todo por `payment_id`:

- **Webhook 1 — MercadoPago:** notifica pago recibido, registra datos del pagador, monto, `payment_id` y timestamp en Google Sheets
- **Webhook 2 — Formulario:** recibe datos del formulario + `payment_id`, los registra en Google Sheets cruzando con el registro de pago
- **Webhook 3 — Calendly:** recibe datos del agendamiento + `payment_id` (vía `utm_content`), cruza con los registros anteriores en Google Sheets y envía correo consolidado al equipo con: datos del formulario + comprobante de pago + comprobante de reserva

**Caso edge conocido:** si el usuario paga pero no completa el formulario o no agenda en Calendly (abandona el flujo), la página `/resumen` no se genera. El equipo recibe igualmente la notificación de pago vía Make y gestiona el caso manualmente.

**Evolución futura** (cuando el volumen lo justifique): reemplazar Make con webhook de MercadoPago → función serverless en Vercel. Los links de pago y Calendly están aislados en `constantes.ts` para facilitar este cambio sin modificar componentes.

---

## Precios — Asesoría artistas

Se muestran ambos precios de forma informativa. Un solo botón de pago apunta al link de MercadoPago en COP. El artista internacional paga con su tarjeta y su banco hace la conversión.

```
$150.000 COP  /  ~$50 USD (referencial)
[Pagar asesoría]  →  MercadoPago (COP)
```

Stripe se evalúa para clientes internacionales después del lanzamiento, según volumen.

---

## Normativas — Asesoría artistas

Se muestran en `/artistas`, dentro de la sección de asesoría, **antes del botón de pago**. No aparecen en `/agendamientos`.

- La sesión debe agendarse dentro de los 3 días posteriores al pago, de lo contrario se pierde la oportunidad de programar la reunión
- El tiempo de espera máximo el día de la sesión es de 10 minutos
- En caso de inasistencia sin aviso previo de mínimo 12 horas, la inversión se pierde en su totalidad
- La asesoría es individual y no transferible

---

## Servicios externos

- **Calendly** — un calendario con dos tipos de evento: diagnóstico gratuito para empresas, asesoría paga para artistas (acceso vía formulario después del pago, con `utm_content=payment_id`)
- **MercadoPago** — cobro de asesoría estratégica para artistas ($150.000 COP). Stripe se evalúa para clientes internacionales después del lanzamiento
- **Make** — automatización de notificaciones: escucha webhooks de MercadoPago, formulario y Calendly; correlaciona eventos en Google Sheets por `payment_id`; envía correo consolidado al equipo
- **Google Analytics 4** — tracking de visitas y eventos (clics artistas vs empresas)
- **Brevo o Mailchimp** — formulario de captura de email (implementación futura)

---

## Buenas prácticas

- Los componentes solo presentan, no tienen lógica de negocio
- Todos los datos (textos, precios, URLs, servicios) viven en `src/data/`, no hardcodeados en componentes
- Constantes centralizadas en `constantes.ts`: WhatsApp, Calendly, MercadoPago, precios
- Sin abstracciones anticipadas — YAGNI. Estructura suficiente para ser mantenible, no arquitectura para impresionar
- Arquitectura abierta a CMS headless futuro (Contentful o Sanity) sin necesidad de reescribir componentes
- **Mobile-first**: todo componente se diseña primero para móvil y escala a desktop. El tráfico esperado es mayoritariamente desde celular

---

## Decisiones pendientes

- [ ] Ítems del formulario previo al agendamiento de artistas (pendiente del cliente)
- [ ] Formulario de captura email marketing (post-lanzamiento)
- [ ] Stripe para clientes internacionales (se evalúa según volumen post-lanzamiento)
- [ ] Automatización avanzada del flujo de pago: webhook + función serverless en Vercel (reemplaza Make cuando el volumen lo justifique)

---

## Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build de producción
pnpm build

# Preview del build
pnpm preview
```

---

## Despliegue

El sitio se despliega automáticamente en Vercel al hacer push a `main`.

**Variables de entorno:** ninguna en el sitio estático. Los links de MercadoPago, Calendly y WhatsApp son públicos y viven en `src/data/constantes.ts`. Las credenciales de Make y Google Sheets se configuran directamente en Make, no en el repositorio.