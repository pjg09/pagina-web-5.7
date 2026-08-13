# Herramientas de medición — OCL 5.7

Estado de las herramientas de medición de Google configuradas para
`www.ocl57group.com`.

**Última actualización:** 12 de agosto de 2026

> [!NOTE]
> Documento de referencia. Los IDs viven en el código (`src/data/constantes.ts`
> para GTM); este archivo los consolida junto con las confirmaciones y la
> configuración externa pendiente.

## IDs y propiedades

| Dato | Valor |
|---|---|
| ID de medición GA4 | `G-X89XX9JJXP` |
| ID del flujo de datos GA4 | `15421436716` |
| ID del contenedor GTM | `GTM-PRZLSD9T` |
| Propiedad Search Console | `sc-domain:ocl57group.com` (tipo **Dominio**, cubre `www` y sin `www`) |
| Correo propietario / administrador | `ocl57group@gmail.com` |

## Arquitectura

- **GA4 se configura DENTRO de GTM**, no como `gtag.js` separado, para evitar el
  doble conteo. En el código solo vive el contenedor GTM (`ID_GTM` en
  `constantes.ts`), inyectado por `BaseLayout.astro` (head + noscript).
- **Consent Mode v2:** el estado por defecto es DENEGADO (`analytics_storage`)
  antes de cargar GTM. El banner de cookies (`src/components/CookieConsent.astro`)
  lo actualiza a concedido al aceptar y persiste la elección en `localStorage`.
  El enlace «Preferencias de cookies» del footer permite revocarla.
- **Dominio canónico:** `https://www.ocl57group.com` (el ápex sin `www` hace
  308 a `www`). Definido en `astro.config.mjs` (`site`).

## Confirmaciones (al 12 de agosto de 2026)

| Confirmación | Estado | Evidencia |
|---|---|---|
| GA4 recibiendo datos | ✅ | Tiempo real mostró 1 usuario activo / 1 vista en `/`. |
| Search Console verificada | ✅ | Verificación por DNS (TXT propagado en Namecheap y Google DNS). Sitemap en estado "Correcto". |
| GTM publicado y funcionando | ✅ | Versión 2 publicada por `ocl57group@gmail.com`. `GTM-PRZLSD9T` inyectado en las 9 páginas en producción. |
| Sitemap | ✅ | `https://www.ocl57group.com/sitemap-index.xml` responde 200 con 9 URLs; enviado y leído en Search Console. |

## No instalado (por decisión)

- **Meta Pixel** — no instalar sin definirlo antes.
- **Google Ads Conversion Tracking** — no instalar sin definirlo antes.
- **Google Signals** — dejar APAGADO en GA4: mete funciones de publicidad y
  cookies que chocan con el banner de consentimiento.

## Configuración externa pendiente (consolas de Google, sin código)

### Importante
- [ ] **GA4 · Retención de datos → 14 meses** (Administrar → Configuración de datos → Retención). Por defecto son 2 meses.
- [ ] **GA4 · Zona horaria (Colombia, GMT-5) y moneda (COP)** (Administrar → Configuración de la propiedad).
- [ ] **GA4 · Excluir tráfico interno** (Administrar → Flujos de datos → Configurar la etiqueta → Definir tráfico interno + filtro de datos). Evita que las visitas propias contaminen los datos.
- [ ] **Verificar el flujo de consentimiento** en GTM → Vista previa (Tag Assistant): denegado antes de aceptar el banner, concedido después.

### Recomendado
- [ ] **Vincular GA4 ↔ Search Console** (GA4 → Administrar → Vinculación de productos → Search Console).
- [ ] Asegurar que **más de una persona** tenga acceso de administrador, para no depender de una sola cuenta.

### Fase siguiente (requiere trabajo en código + GTM)
- [ ] **Eventos clave / conversiones**: clic en WhatsApp y envío del formulario de contacto. Se emiten al `dataLayer` desde el código y se marcan como evento clave en GA4.

## Otros pendientes (fuera de medición)

- [ ] **Revisión jurídica** de los documentos legales (política de datos, términos, cookies).
