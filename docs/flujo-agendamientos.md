> [!NOTE]
> Índice de los flujos de agendamiento. Mapa de alto nivel de los tres eventos y la página hub. El detalle de cada flujo vive en su propio documento (enlazado abajo). Plan de trabajo vivo — se actualiza a medida que se construye.

# Agendamientos — mapa de los tres eventos

## Los tres eventos

El sitio ofrece **tres** eventos de agendamiento, repartidos así: **empresas 1 (gratis) · artistas 2 (comercial gratis + estratégica de pago)**. Todos se listan en la página hub `/agendamientos` (ya construida, secciones 1–4, `src/pages/agendamientos.astro`).

| # | Evento | Audiencia | Pago | Ruta dedicada | CTA en el hub |
|---|---|---|---|---|---|
| 1 | Reunión comercial empresas | Empresas | **Sin costo** | `/agendamientos-empresas` | "Agendar reunión para mi empresa" |
| 2 | Reunión comercial artistas | Artistas | **Sin costo** | `/agendamientos-artistas-comercial` | "Quiero conocer las soluciones para artistas" |
| 3 | Asesoría estratégica | Artistas | **$150.000 COP / 50 USD** | `/agendamientos-artistas-estrategica` | "Solicitar asesoría estratégica" |

> **Ojo — el evento de pago es de ARTISTAS, no de empresas.** Empresas solo tiene el evento gratuito. Esta tabla es la fuente de verdad ante cualquier duda.

## Documento por flujo

| Flujo | Documento |
|---|---|
| Empresas comercial (gratis) | [`flujo-agendamiento-empresas.md`](./flujo-agendamiento-empresas.md) |
| Artistas comercial (gratis) | [`flujo-agendamiento-artistas-comercial.md`](./flujo-agendamiento-artistas-comercial.md) |
| Artistas asesoría estratégica (pago) | [`flujo-pago-artistas.md`](./flujo-pago-artistas.md) |
| Página hub `/agendamientos` | `src/pages/agendamientos.astro` (construida) |

## Arquitectura compartida y decisiones transversales

Las decisiones que aplican a **todos** los eventos (para no repetirlas en cada doc):

| Decisión | Valor | Nota |
|---|---|---|
| Plan de Calendly | **Gratuito** | Sin webhooks server-side. Por eso **ningún** flujo puede usar `invitee.created` → `doPost`; todos resuelven la salida de datos por **parseo del correo de notificación** (Opción B). Aplica incluso al flujo de pago. |
| Cuentas de Calendly | **Una por evento (3 en total)** | Las tres pertenecen al correo corporativo (alias o cuentas aparte, todas bajo `ocl57group.com`). Cada evento = un event type/cuenta distinta. |
| Persistencia + notificación | **Opción B — Apps Script parsea el correo de Calendly** | Trigger temporal lee el correo que Calendly ya envía, extrae datos, escribe en Sheet y manda correo de branding. Detalle en el doc de empresas. |
| Scripts de Apps Script | **Uno por evento (3 scripts)** | No se comparte un script entre eventos. Cada uno parsea su propio correo con sus propias anclas. |
| Sheets | **Una por audiencia (2 archivos)** — *confirmado* | `empresas` (1 pestaña) y `artistas` (2 pestañas: `comercial` y `estrategica`, porque los esquemas de columnas difieren). |
| Correo de branding al cliente | **En los 3 eventos, con copy propio por caso** | Cada evento envía su correo de branding con su propio texto. Tres copys distintos. |
| Envío de correos desde Apps Script | **`GmailApp`, sin `from` alias** | Por el fallo SPF documentado en CLAUDE.md: usar `name` + `replyTo`, nunca `from: alias`. Unifica el criterio (el doc viejo de pago decía `MailApp`). |

## Diferencia clave entre los flujos gratis y el de pago

- **Gratis (1 y 2):** la página **solo embebe** el inline widget de Calendly. Cero JS custom. Todo lo demás es un trigger temporal de Apps Script que parsea el correo. No hay Web App, no hay URL en `constantes.ts`.
- **Pago (3):** agrega **por delante** el cobro con Wompi (webhook real de Wompi → Web App), la generación de token UUID, y un `/formulario?token=…` propio antes de mandar al usuario a Calendly. La salida de Calendly, en cambio, **también** se resuelve por parseo de email (no por webhook), correlacionando el token vía una pregunta personalizada de Calendly (`a1=TOKEN`). Ver su doc.

> **Decisiones derivadas confirmadas** (ratificadas por el usuario): (a) artistas = **1 archivo de Sheet con pestañas** `comercial`/`estrategica`; (b) el flujo de pago correlaciona el token vía **pregunta personalizada `a1=TOKEN`** (no `utm_content`). Son firmes, no supuestos abiertos.

## Estado global

- [x] Página hub `/agendamientos.astro` construida (secciones 1–4).
- [x] Modelo de los 3 eventos y decisiones transversales definidos.
- [ ] Construir las 3 páginas de embed: `/agendamientos-empresas`, `/agendamientos-artistas-comercial`, `/agendamientos-artistas-estrategica`.
- [ ] Crear los 3 event types/cuentas de Calendly bajo el correo corporativo.
- [ ] Agregar/renombrar constantes en `constantes.ts`: `CALENDLY_EMPRESAS`, `CALENDLY_ARTISTAS_COMERCIAL`, `CALENDLY_ARTISTAS_ESTRATEGICA` (hoy solo existen `CALENDLY_EMPRESAS` y `CALENDLY_ARTISTAS`), más `WOMPI_ASESORIA_ARTISTAS` (ya existe).
- [ ] Crear las 2 Sheets (empresas / artistas) y los 3 scripts de Apps Script.

## Handoff — pendiente para la próxima sesión

Estado al cerrar esta sesión: **arquitectura y documentación de los 3 flujos cerradas**. Todas las decisiones de diseño están tomadas y ratificadas. No hay nada de código de agendamientos construido todavía (salvo el hub y los CTAs de `empresas.astro`/`agendamientos.astro`).

**Lo que falta es insumo del negocio + implementación, no diseño.** En orden:

1. **Evento oficial de Wompi** — *siguiente paso acordado.* Confirmar contra la doc oficial de Wompi el nombre exacto del evento de pago aprobado (documentado tentativamente como `transaction.updated` con estado `APPROVED`). Bloquea la Función 1 del script de pago.
2. **Preguntas custom de los 3 event types de Calendly** — 3 juegos distintos (empresas / artistas comercial / artistas estratégica). Definen las columnas de cada Sheet/pestaña y las anclas de cada parser. Bloquean escribir los scripts.
3. **Copy de los 3 correos de branding** — uno por evento.
4. **Cuenta(s) Gmail de destino** — confirmar que la notificación de cada event type cae en el Gmail donde corre su script (recipiente directo en Calendly o forwarder desde el webmail). `GmailApp` solo lee el buzón de la cuenta que ejecuta el script.
5. **Links reales de Calendly y Wompi** — reemplazar placeholders en `constantes.ts` una vez creados los event types y el link de pago.

**Todo lo demás (por qué Opción B, por qué no iframe/API, plan gratuito de Calendly, token vía `a1`, script híbrido del flujo de pago, SPF/`GmailApp`, idempotencia por label) está documentado en los tres docs de flujo — no hace falta re-derivarlo.**

> Pendiente aparte, fuera de estos docs: `CLAUDE.md` aún lista `_agendamientos.astro (oculta)` y no menciona el hub construido ni estos docs nuevos (`flujo-agendamientos.md`, `flujo-agendamiento-artistas-comercial.md`). Actualizar su sección de páginas e índice de `docs/` cuando se retome.
