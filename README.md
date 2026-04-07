# 5.7 / Onda Creativa Launch — Sitio Web

Sitio web institucional y de conversión para **5.7 / Onda Creativa Launch**, agencia colombiana de servicios digitales para artistas musicales y empresas/marcas.

---

## Stack tecnológico

| Capa | Herramienta |
|------|-------------|
| Framework | Astro (sitio estático) |
| Hosting | Vercel |
| Agendamientos | Calendly |
| Pagos | Stripe / MercadoPago (pendiente de definir) |
| Analytics | Google Analytics 4 |
| Email marketing | Brevo o Mailchimp (implementación futura) |
| Gestor de paquetes | pnpm |
| Lenguaje | TypeScript |

---

## Estructura del proyecto

pagina-web-5.7/
├── public/                  # Archivos estáticos (imágenes, fuentes, favicon)
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── CTAWhatsApp.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── Hero.astro
│   │   └── ServiceCard.astro
│   ├── data/                # Datos del sitio separados de los componentes
│   │   ├── constantes.ts    # URLs, teléfonos, links de Calendly, precios
│   │   └── servicios.ts     # Listado de servicios para artistas y empresas
│   ├── layouts/
│   │   └── BaseLayout.astro # Estructura HTML base heredada por todas las páginas
│   ├── pages/               # Cada archivo es una ruta del sitio
│   │   ├── index.astro      # /
│   │   ├── empresas.astro   # /empresas
│   │   ├── artistas.astro   # /artistas
│   │   ├── agendamientos.astro # /agendamientos
│   │   └── contacto.astro   # /contacto
│   └── styles/
│       └── global.css       # Estilos globales
├── astro.config.mjs
├── tsconfig.json
└── pnpm-lock.yaml

---

## Páginas

| Ruta | Objetivo |
|------|----------|
| `/` | Explicar qué es 5.7 y segmentar al visitante (artista o empresa) |
| `/empresas` | Convertir empresas en clientes |
| `/artistas` | Convertir artistas en clientes, incluye flujo pago → agendamiento |
| `/agendamientos` | Dos flujos: asesoría artistas (pago + Calendly) y diagnóstico empresas (solo Calendly) |
| `/contacto` | WhatsApp, correo y redes sociales |

---

## Servicios externos

- **Calendly** — un calendario con dos tipos de evento: con pago obligatorio para artistas, sin pago para empresas
- **Stripe / MercadoPago** — cobro de asesoría estratégica para artistas ($150.000 COP / $50 USD)
- **Google Analytics 4** — tracking de visitas y eventos (clics artistas vs empresas)
- **Brevo o Mailchimp** — formulario de captura para campañas de email (implementación futura)

---

## Buenas prácticas

- Los componentes solo presentan, no tienen lógica de negocio
- Todos los datos (textos, precios, URLs, servicios) viven en `src/data/`, no hardcodeados en componentes
- Constantes centralizadas en `constantes.ts`: WhatsApp, Calendly, precios
- Sin abstracciones anticipadas — estructura suficiente para ser mantenible
- Arquitectura abierta a CMS headless futuro (Contentful o Sanity) sin reescribir componentes

---

## Decisiones pendientes

- [ ] Stripe vs MercadoPago vs ambos
- [ ] Ítems del formulario previo al agendamiento de artistas
- [ ] Formulario de captura email marketing

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