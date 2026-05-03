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

**Flujo automatizado vía Make con token por email. Sin backend propio. Compatible con MercadoPago y Stripe.**

```
Artista
  → clic en "Pagar asesoría"
  → procesador de pago (MercadoPago COP / Stripe internacional)
  → pago aprobado
  → Make detecta el pago vía webhook
  → Make genera token único (UUID) y lo guarda en Google Sheets con el payment_id
  → Make envía correo al artista con enlace personalizado: /formulario?token=UUID
  → artista abre el correo y hace clic en el enlace
  → /formulario valida que el token exista en Google Sheets
  → artista llena el formulario (proyecto, redes, plataformas, objetivos)
  → formulario POST a Make webhook con datos + token
  → Make registra el formulario en Google Sheets cruzando con el pago
  → artista es redirigido a Calendly con token como parámetro de correlación
  → artista agenda su sesión
  → Calendly notifica a Make (webhook)
  → Make cruza los tres registros (pago + formulario + agendamiento) en Google Sheets
  → Make envía correo de confirmación automático al artista
  → Make envía notificación consolidada al equipo
  → artista llega a /resumen con resumen de su sesión agendada
```

**Por qué token en lugar de payment_id directo:**
Usar el `payment_id` crudo en la URL permite que cualquier persona que conozca la estructura acceda al formulario sin haber pagado. El token UUID generado por Make es de un solo uso, no predecible, y se puede invalidar desde Google Sheets.

**Notificaciones al equipo vía Make:**

Make escucha tres webhooks y correlaciona todo por `token`:

- **Webhook 1 — Procesador de pago:** pago aprobado → genera token UUID → guarda en Sheets → envía correo al artista con enlace
- **Webhook 2 — Formulario:** recibe datos del artista + token → valida token → registra en Sheets cruzando con el pago
- **Webhook 3 — Calendly:** recibe datos del agendamiento + token → cruza los tres registros → envía correo de confirmación al artista + notificación al equipo

**Compatibilidad con procesadores de pago:**
El flujo es idéntico para MercadoPago y Stripe. Solo cambia el trigger del Webhook 1 en Make. Al agregar Stripe se añade un segundo trigger apuntando al mismo escenario de Make.

**Caso edge — artista paga pero abandona el flujo:**
Make recibe el pago y genera el token. Si el artista no abre el correo, no llena el formulario o no agenda, el equipo recibe igual la notificación del pago y gestiona el caso manualmente (reenvío del correo o contacto directo).

**Evolución futura:** reemplazar Make con webhooks directos a funciones serverless en Vercel cuando el volumen lo justifique. Los links de pago y Calendly están aislados en `constantes.ts` para facilitar ese cambio sin tocar componentes.

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