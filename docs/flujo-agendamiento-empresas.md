> [!NOTE]
> Plan de trabajo vivo. Se actualiza a medida que se construye cada paso — no es un registro histórico como los ADR de `decisiones-arquitectura.md`, sino el estado actual de la implementación de este flujo específico.
>
> **Este es 1 de los 3 eventos de agendamiento.** Ver el mapa general en [`flujo-agendamientos.md`](./flujo-agendamientos.md). Su gemelo gratuito para artistas es [`flujo-agendamiento-artistas-comercial.md`](./flujo-agendamiento-artistas-comercial.md) (misma arquitectura Opción B, script y Sheet propios). El flujo de pago es [`flujo-pago-artistas.md`](./flujo-pago-artistas.md). **Esta sección "Opción B" es la referencia canónica de la mecánica de parseo** que reusan los otros dos.

# Flujo de agendamiento — Empresas comercial (sin pago)

## Resumen del flujo

A diferencia del flujo de artistas (que requiere pago previo y token UUID de Apps Script), el flujo de empresas es directo: el usuario agenda un diagnóstico estratégico sin costo, sin pasar por ningún procesador de pago. Calendly resuelve la mayor parte del trabajo (disponibilidad, confirmación, comprobante); el sitio solo necesita alojar el calendario embebido y, opcionalmente, avisarle al equipo por un canal propio.

## Decisiones tomadas

| Decisión | Valor | Por qué |
|---|---|---|
| Página del calendario | `/agendamientos-empresas` (ruta fija, ya enlazada) | Es la ruta que usa el CTA de la card "Empresas y marcas" del hub `/agendamientos`. El hub **ya está construido** (secciones 1–4, `src/pages/agendamientos.astro`) — ya no es "futuro". |
| Sheet destino | Archivo **`empresas`** (audiencia empresas), 1 pestaña | Decisión transversal: Sheet por audiencia. Este flujo escribe en su propio archivo, distinto del de artistas. |
| Script de Apps Script | **Propio de este evento** (no compartido) | Decisión transversal: script por evento. Parsea solo el correo de Calendly de empresas. |
| Tipo de embed | **Inline widget** de Calendly (no popup, no redirect externo) | El usuario nunca sale del sitio; ve la disponibilidad real dentro de una página propia. |
| CTAs que redirigen al calendario | Solo 2: botón del hero ("Agendar diagnóstico sin costo") y botón de la sección 5 — Diagnóstico ("Agendar reunión") | El resto de los CTAs de la sección de soluciones (4 botones: "Quiero estructurar mi marca", "Quiero activar mis redes", "Quiero mejorar mi imagen", "Quiero más alcance") apuntan a WhatsApp (`WHATSAPP_CTA`), no al calendario. |
| Comprobante del usuario | Nativo de Calendly | Pantalla de confirmación dentro del propio embed + email automático con `.ics`. No se construye nada custom para esto. |
| Notificación al equipo | **Nativa de Calendly** | Calendly ya envía el correo de notificación al equipo cuando se agenda. No se construye un canal propio para "avisar"; ese mismo correo es la fuente de datos del flujo de persistencia (ver abajo). |
| Backup de Gmail del equipo | **Configuración de correo, no código** | No requiere Apps Script. El correo del equipo (webmail/Roundcube en `ocl57group.com`) tiene un forwarder/resender que lleva la copia al Gmail backup. Ese Gmail es además la cuenta donde corre el script (ver Opción B). |
| Persistencia del agendamiento (Sheet) + correo branding al cliente | **Opción B — Apps Script por parseo del correo de Calendly** | Decidida. Un trigger temporal en Apps Script lee el correo de notificación de Calendly ya recibido, extrae los datos (nombre, email, empresa, respuestas, fecha/hora), los escribe en la Sheet y envía un correo de branding al cliente. No usa la API de Calendly ni JS en el cliente. Detalle completo en la sección "Opción B". |
| Lectura directa del iframe de Calendly | **Descartada** | El inline widget es un iframe cross-origin (`calendly.com`): la *same-origin policy* impide leer su DOM/formulario. `postMessage` (`calendly.event_scheduled`) solo entrega URIs, no nombre/email/fecha. Por eso no se puede "recolectar el formulario" desde nuestra página aunque esté inline. |

## Estado de implementación

- [x] CTAs de `empresas.astro` redirigidos: hero y sección 5 (Diagnóstico) → `/agendamientos-empresas`; los 4 CTAs de la sección de soluciones → WhatsApp (`WHATSAPP_CTA`).
- [x] Decisión de arquitectura de persistencia/notificación: **Opción B** (Apps Script por parseo de email). Se descarta leer el iframe y se descarta la ruta de API de Calendly.
- [ ] Construir `/agendamientos-empresas.astro`: header propio (consistente con el sistema de diseño) + inline widget de Calendly. **Sin JS custom** — la página solo embebe el widget; todo lo demás corre del lado servidor.
- [x] Ruta fija: `/agendamientos-empresas` (usada por el hub `/agendamientos` y por `empresas.astro`).
- [ ] Definir si el embed se tiñe con los colores del sitio vía parámetros de URL de Calendly (`background_color`, `text_color`, `primary_color`) para no romper la estética oscura.
- [ ] Reemplazar el placeholder `CALENDLY_EMPRESAS` en `constantes.ts` con el link real una vez exista el event type configurado en Calendly.
- [ ] Configurar el event type de Calendly: preguntas del formulario (nombre de empresa, qué quiere lograr, etc.) y agregar el Gmail backup como recipiente de notificación (para que el correo llegue a la cuenta donde corre el script).
- [ ] Crear el script de Apps Script (Opción B): trigger temporal + parseo del correo de Calendly + escritura en Sheet + correo branding al cliente. Código espejo en `docs/` (pendiente, análogo a `docs/apps-script-contacto.gs`).
- [ ] Crear la Google Sheet destino con las columnas definidas (ver Opción B).
- [x] Página `/agendamientos` (hub) — **construida** (secciones 1–4, `src/pages/agendamientos.astro`). Lista los tres eventos.
- [ ] Flujo de artistas comercial (gratis) — gemelo de este. Ver `docs/flujo-agendamiento-artistas-comercial.md`.
- [ ] Flujo de artistas estratégica (con pago) — ver `docs/flujo-pago-artistas.md`.

## Opción B — Apps Script por parseo de email (decidida)

### Por qué B y no las otras rutas

- **Leer el iframe (descartada):** el inline widget es cross-origin (`calendly.com`). La *same-origin policy* del navegador impide leer el DOM/inputs del iframe. Lo único que cruza la frontera es `postMessage`, y el evento `calendly.event_scheduled` solo entrega **URIs** (`event.uri`, `invitee.uri`), no nombre/email/fecha. Estar "inline" es visual; el iframe sigue sellado.
- **API de Calendly (descartada):** resolver esas URIs a datos reales requiere la API v2 con Personal Access Token, cuya disponibilidad en plan gratuito está sin confirmar, y obligaría a llamarla desde el servidor (nunca desde el navegador, para no exponer el token). Suma una dependencia de pago/incierta.
- **Parseo de email (elegida):** Calendly **ya** envía un correo de notificación al equipo con **todos** los datos juntos (respuestas del formulario + fecha/hora). Parsear ese correo:
  - No depende del plan de Calendly ni de su API.
  - No requiere JS en el cliente → elimina la fragilidad del `fetch` con `mode: 'no-cors'` y el riesgo de "el usuario cerró la pestaña antes de que dispare".
  - Reusa el patrón ya conocido del proyecto (Apps Script + GmailApp + Sheets).
  - **Contras asumidas:** (1) es **frágil al formato** del correo de Calendly — si Calendly cambia la plantilla, el parser se rompe; (2) **no es instantáneo** — la latencia depende de la frecuencia del trigger (no hay captura en tiempo real del lead).

### Flujo paso a paso

```
1. Cliente entra a /agendamientos-empresas(-comercial) → ve el inline widget de Calendly.
2. Agenda: elige fecha/hora y llena el formulario de Calendly (nombre, email, empresa, etc.).
3. Calendly hace su trabajo NATIVO (sin código nuestro):
     - Pantalla de confirmación dentro del embed.
     - Correo de confirmación + .ics al cliente.
     - Correo de NOTIFICACIÓN al equipo  ──┐
4. Ese correo de notificación llega al Gmail backup del equipo
   (configurado como recipiente de notificación en el event type,
    o vía el forwarder/resender desde el webmail).
5. Apps Script (trigger temporal, cada N min) corre en ESA cuenta Gmail:
     a. Busca correos NO procesados de Calendly (filtro por remitente/asunto/label).
     b. Parsea cada uno: nombre, email, empresa, respuestas, fecha/hora del evento.
     c. Escribe una fila en la Google Sheet.
     d. Envía el correo de BRANDING al cliente (GmailApp).
     e. Marca el correo como procesado (label/leído) para no reprocesarlo.
```

La página `/agendamientos-empresas` **solo embebe el widget**. No lleva listener de `postMessage` ni `fetch`. Todo lo demás vive en Apps Script, en una cuenta de Google, sobre un schedule.

### Mecánica del Apps Script

- **Tipo de script:** standalone con **trigger temporal** (time-driven), **no** un Web App. No recibe POST del navegador → no necesita URL publicada ni entrada en `constantes.ts`. Es independiente del script de `/formulario` y del de `contacto.astro`.
- **Cuenta donde corre:** la cuenta **Gmail backup** del equipo, que es donde aterriza el correo de notificación de Calendly. `GmailApp` solo lee el buzón de la cuenta que ejecuta el script; el webmail de Roundcube en `ocl57group.com` **no** es accesible por `GmailApp`, por eso el flujo depende de que la notificación llegue al Gmail (vía recipiente directo en Calendly o vía forwarder).
- **Búsqueda de correos:** `GmailApp.search()` con filtro por remitente de Calendly (ej. `notifications@calendly.com`) **y** por estado no procesado. Usar una **label** propia (ej. `agendamiento-procesado`) como marca de idempotencia: solo se procesan los hilos sin esa label, y al terminar se les aplica. Evita filas/correos duplicados si el trigger se solapa o un correo no se pudo borrar.
- **Parseo:** extraer del cuerpo (texto plano preferible al HTML) los campos por sus etiquetas conocidas del correo de Calendly. Mantener los regex/anclas en constantes al inicio del script para que, cuando Calendly cambie el formato, el ajuste sea en un solo lugar.
- **Escritura en Sheet:** `appendRow` a la Sheet destino. La Sheet vive en la misma cuenta de Google (mismo patrón que el resto del proyecto).
- **Correo branding al cliente:** `GmailApp.sendEmail`. **Reusar los gotchas ya documentados en CLAUDE.md:**
  - **No** pasar `from: "contacto@ocl57group.com"` (alias) → causa fallo SPF silencioso. Usar solo `name` (remitente visible) + `replyTo` (alias del equipo).
  - Asumir que puede caer en spam del cliente → incluir nota en el cuerpo, igual que en el flujo de `contacto.astro`.

### Datos y columnas de la Sheet (propuesta inicial)

| Columna | Origen |
|---|---|
| Timestamp de procesamiento | `new Date()` del script |
| Nombre del invitado | parseo del correo |
| Email del invitado | parseo del correo |
| Empresa | parseo (pregunta custom de Calendly) |
| Fecha/hora del evento | parseo del correo |
| Respuestas adicionales | parseo (preguntas custom de Calendly) |
| Estado correo branding | `enviado` / `error` (resultado del `sendEmail`) |

Las columnas dependen de las **preguntas custom configuradas en el event type de Calendly** (pendiente de definir, ver checklist). El parser debe alinearse a esas preguntas.

### Permisos (OAuth scopes)

Scopes requeridos en `appsscript.json`: `gmail.readonly` (o `gmail.modify` si se aplican labels) + `gmail.send` + `spreadsheets`. **Recordar el gotcha de CLAUDE.md:** agregar scopes no reactiva el consentimiento OAuth por sí solo — hay que revocar el acceso en `myaccount.google.com/permissions` y re-ejecutar una función para disparar el nuevo consentimiento. Si se aplican labels (idempotencia), `gmail.readonly` no basta → usar `gmail.modify`.

### Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Calendly cambia el formato del correo → parser roto | Anclas/regex centralizados; validar que los campos extraídos no vengan vacíos antes de escribir, y loggear/alertar si el parseo falla. |
| Trigger reprocesa el mismo correo → fila/correo duplicado | Label de idempotencia (`agendamiento-procesado`); procesar solo hilos sin esa label. |
| El correo de Calendly no llega al Gmail (solo al webmail) | Configurar el Gmail backup como recipiente de notificación directo en el event type, **además** del forwarder. |
| Latencia (no es tiempo real) | Aceptada. Ajustar la frecuencia del trigger (ej. 5–15 min) según urgencia comercial. |

## Cómo funciona el inline widget de Calendly (referencia técnica)

```html
<div
  class="calendly-inline-widget"
  data-url="https://calendly.com/usuario/evento?<params-opcionales>"
  style="min-width:320px;height:700px;"
></div>
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

**Parámetros de URL opcionales (van pegados al final de `data-url`, separados por `&`):**

- `hide_event_type_details=1` — oculta el header de Calendly con nombre/duración del evento (útil si ya lo mostramos en nuestro propio header).
- `hide_gdpr_banner=1` — oculta el banner de cookies de Calendly.
- `background_color=050508&text_color=ffffff&primary_color=00c2ff` — colores en hex SIN el `#`, para acercar el embed a la paleta del sitio (`--bg-base` y `--cyan`).
- `name=...&email=...` — prellenan esos campos si ya los tuviéramos capturados antes (no aplica todavía, no hay formulario previo en este flujo).

**Lo que Calendly NO necesita que nosotros construyamos:** verificación de disponibilidad, manejo de zonas horarias, envío del comprobante/`.ics`, ni la lógica de "slot ya tomado". Todo eso vive del lado de Calendly.

## Qué falta decidir / confirmar con el usuario

1. ~~Nombre final de la ruta~~ — **resuelto:** `/agendamientos-empresas` (fija).
2. **Link real de Calendly para empresas** — hoy `CALENDLY_EMPRESAS` en `constantes.ts` es un placeholder (`https://calendly.com/TU_USUARIO/diagnostico-empresas`). Se necesita el event type real configurado en la cuenta de Calendly antes de que el embed funcione de verdad.
3. **Preguntas personalizadas del formulario de Calendly** — qué campos pedirá Calendly al agendar (nombre de empresa, qué quiere lograr, etc.) se configura del lado de Calendly, no en este repo. **Definen las columnas de la Sheet y las anclas del parser** (ver Opción B). Decidir antes de escribir el script.
4. **Cuenta Gmail backup y entrega de la notificación** — confirmar a qué Gmail llega el correo de notificación de Calendly (cuenta donde correrá el script) y si se configura como recipiente directo en el event type o llega vía forwarder desde el webmail.
5. **Estética del embed** — confirmar si se aplican los parámetros de color para que combine con el tema oscuro del sitio, o si se deja con los colores default de Calendly.
6. **Contenido del correo branding al cliente** — copy y diseño del correo que envía el script tras el agendamiento (es branding extra; la confirmación funcional ya la manda Calendly).
