# 5.7 / Onda Creativa Launch — Sitio Web

Sitio web institucional y de conversión para **5.7 / Onda Creativa Launch**, agencia colombiana de servicios digitales para artistas musicales y empresas/marcas.

---

## Stack tecnológico

| Capa | Herramienta |
|------|-------------|
| Framework | Astro (sitio estático) |
| Hosting | Vercel |
| Agendamientos | Calendly |
| Pagos | MercadoPago (lanzamiento) — Stripe internacional (posible evaluación futura) |
| Analytics | Google Analytics 4 |
| Email marketing | Brevo o Mailchimp (implementación futura) |
| Gestor de paquetes | pnpm |
| Lenguaje | TypeScript |

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
│   │   ├── contacto.astro      # /contacto
│   │   └── confirmacion.astro  # /confirmacion — página post-pago MercadoPago
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
| `/artistas` | Convertir artistas en clientes, incluye flujo pago → agendamiento |
| `/agendamientos` | Dos flujos: asesoría artistas (pago manual) y diagnóstico empresas (Calendly) |
| `/contacto` | WhatsApp, correo y redes sociales |
| `/confirmacion` | Página post-pago: instrucciones para enviar comprobante y agendar sesión |

---

## Flujo de pago — Asesoría artistas

**Versión de lanzamiento: flujo manual. Decisión intencional.**

El objetivo es validar demanda antes de invertir en automatización. Cuando el volumen lo justifique, este flujo se reemplaza sin tocar otros componentes.

```
Usuario
  → clic en "Pagar asesoría"
  → link de pago MercadoPago
  → pago completado
  → /confirmacion
  → instrucciones: enviar comprobante por WhatsApp
  → equipo 5.7 verifica manualmente
  → envío del link de Calendly al usuario
```

**Evolución futura** (cuando el volumen lo justifique):

Reemplazar con webhook de MercadoPago → función serverless en Vercel → generación automática de link de Calendly. El link de pago y el de Calendly están aislados en `constantes.ts` para facilitar este cambio sin modificar componentes.

---

## Servicios externos

- **Calendly** — un calendario con dos tipos de evento: diagnóstico gratuito para empresas, asesoría paga para artistas (link se entrega manualmente tras verificar pago)
- **MercadoPago** — cobro de asesoría estratégica para artistas ($150.000 COP / $50 USD). Stripe se evalúa para clientes internacionales después del lanzamiento.
- **Google Analytics 4** — tracking de visitas y eventos (clics artistas vs empresas)
- **Brevo o Mailchimp** — formulario de captura de email (implementación futura)

---

## Buenas prácticas

- Los componentes solo presentan, no tienen lógica de negocio
- Todos los datos (textos, precios, URLs, servicios) viven en `src/data/`, no hardcodeados en componentes
- Constantes centralizadas en `constantes.ts`: WhatsApp, Calendly, MercadoPago, precios
- Sin abstracciones anticipadas — YAGNI. Estructura suficiente para ser mantenible, no arquitectura para impresionar
- Arquitectura abierta a CMS headless futuro (Contentful o Sanity) sin necesidad de reescribir componentes
- **Mobile-first**: todo componente se diseña primero para móvil y escala a desktop. El tráfico esperado es mayoritariamente desde celular.

---

## Decisiones pendientes

- [ ] Ítems del formulario previo al agendamiento de artistas (pendiente del cliente)
- [ ] Formulario de captura email marketing (post-lanzamiento)
- [ ] Stripe para clientes internacionales (se evalúa según volumen post-lanzamiento)
- [ ] Automatización del flujo de pago: webhook + función serverless en Vercel (cuando el volumen lo justifique)

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

Variables de entorno requeridas: ninguna en esta versión. Los links de MercadoPago, Calendly y WhatsApp son públicos y viven en `src/data/constantes.ts`.