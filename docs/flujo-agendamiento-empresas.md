> [!NOTE]
> Plan de trabajo vivo. Se actualiza a medida que se construye cada paso — no es un registro histórico como los ADR de `decisiones-arquitectura.md`, sino el estado actual de la implementación de este flujo específico.

# Flujo de agendamiento — Empresas (sin pago)

## Resumen del flujo

A diferencia del flujo de artistas (que requiere pago previo y token UUID de Apps Script), el flujo de empresas es directo: el usuario agenda un diagnóstico estratégico sin costo, sin pasar por ningún procesador de pago. Calendly resuelve la mayor parte del trabajo (disponibilidad, confirmación, comprobante); el sitio solo necesita alojar el calendario embebido y, opcionalmente, avisarle al equipo por un canal propio.

## Decisiones tomadas

| Decisión | Valor | Por qué |
|---|---|---|
| Página del calendario | `/agendamientos-empresas` (nueva) | `/agendamientos` se reserva como página "hub" futura que listará todos los eventos/flujos para que el cliente elija. No se construye todavía. |
| Tipo de embed | **Inline widget** de Calendly (no popup, no redirect externo) | El usuario nunca sale del sitio; ve la disponibilidad real dentro de una página propia. |
| CTAs que redirigen al calendario | Solo 2: botón del hero ("Agendar diagnóstico sin costo") y botón de la sección 5 — Diagnóstico ("Agendar reunión") | El resto de los CTAs de la sección de soluciones (4 botones: "Quiero estructurar mi marca", "Quiero activar mis redes", "Quiero mejorar mi imagen", "Quiero más alcance") apuntan a WhatsApp (`WHATSAPP_CTA`), no al calendario. |
| Comprobante del usuario | Nativo de Calendly | Pantalla de confirmación dentro del propio embed + email automático con `.ics`. No se construye nada custom para esto. |
| Notificación al equipo | **Por verificar** — Calendly está en plan gratuito, sin webhooks server-side | Alternativa propuesta: escuchar el evento `calendly.event_scheduled` (`postMessage` del lado del cliente, disponible en todos los planes) y disparar un `fetch()` desde el navegador hacia el Web App de Apps Script existente. Pendiente confirmar si la API de lectura de Calendly (plan gratuito) puede resolver nombre/email a partir de la URI del evento/invitado que entrega ese mensaje. |

## Estado de implementación

- [x] CTAs de `empresas.astro` redirigidos: hero y sección 5 (Diagnóstico) → `/agendamientos-empresas`; los 4 CTAs de la sección de soluciones → WhatsApp (`WHATSAPP_CTA`).
- [ ] Verificar si la API de Calendly (plan gratuito) puede resolver los datos del invitado (nombre/email) a partir de la URI que entrega el evento `calendly.event_scheduled`.
- [ ] Construir `/agendamientos-empresas.astro`: header propio (consistente con el sistema de diseño) + inline widget de Calendly.
- [ ] Definir si el embed se tiñe con los colores del sitio vía parámetros de URL de Calendly (`background_color`, `text_color`, `primary_color`) para no romper la estética oscura.
- [ ] Reemplazar el placeholder `CALENDLY_EMPRESAS` en `constantes.ts` con el link real una vez exista el event type configurado en Calendly.
- [ ] (Si la verificación de API resulta viable) Implementar el listener de `postMessage` + llamada al Web App de Apps Script para notificar al equipo.
- [ ] Página `/agendamientos` (hub) — futura, fuera de alcance de este plan.
- [ ] Flujo de artistas (con pago) — bloqueado, fuera de alcance de este plan. Ver `docs/flujo-pago-artistas.md`.

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

1. **Link real de Calendly para empresas** — hoy `CALENDLY_EMPRESAS` en `constantes.ts` es un placeholder (`https://calendly.com/TU_USUARIO/diagnostico-empresas`). Se necesita el event type real configurado en la cuenta de Calendly antes de que el embed funcione de verdad.
2. **Preguntas personalizadas del formulario de Calendly** — qué campos pedirá Calendly al agendar (nombre de empresa, qué quiere lograr, etc.) se configura del lado de Calendly, no en este repo. Afecta qué datos llegan en la notificación al equipo.
3. **Estética del embed** — confirmar si se aplican los parámetros de color para que combine con el tema oscuro del sitio, o si se deja con los colores default de Calendly.
4. **Resultado de la verificación de la API de Calendly en plan gratuito** — determina si el bridge hacia Apps Script (notificación al equipo) es viable tal como está planteado, o si se necesita otra alternativa (ej. quedarse solo con el email nativo de Calendly al equipo).
