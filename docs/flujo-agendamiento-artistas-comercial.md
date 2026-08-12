> [!NOTE]
> Plan de trabajo vivo. Uno de los 3 eventos de agendamiento — ver el mapa en [`flujo-agendamientos.md`](./flujo-agendamientos.md).
>
> **Este flujo es el gemelo gratuito para artistas del flujo de empresas.** Comparte la **misma arquitectura Opción B** (Calendly gratuito + Apps Script parsea el correo → Sheet + correo branding). Para no duplicar, la mecánica detallada (por qué se descarta leer el iframe y la API, cómo funciona el trigger, idempotencia por label, scopes, riesgos) vive en [`flujo-agendamiento-empresas.md`](./flujo-agendamiento-empresas.md) → sección "Opción B", que es la referencia canónica. Aquí solo se documentan las **diferencias específicas** de este evento.

# Flujo de agendamiento — Artistas comercial (sin pago)

## Qué es

Reunión comercial gratuita para artistas: conocer las soluciones, resolver dudas sobre el proyecto musical, sin evaluación profunda ni preparación previa. **No confundir con la asesoría estratégica de pago** (`flujo-pago-artistas.md`), que es un evento distinto, de pago, con formulario y token.

## Lo que este flujo hereda de la Opción B (empresas)

Idéntico al de empresas, sin cambios:

- La página **solo embebe** el inline widget de Calendly. Cero JS custom.
- Calendly (plan gratuito) hace lo nativo: confirmación, `.ics`, correo al cliente, correo de notificación al equipo.
- Un **trigger temporal** de Apps Script parsea el correo de notificación → escribe en la Sheet → envía el correo de branding al cliente.
- Idempotencia por label, `GmailApp` sin `from` alias (SPF), scopes `gmail.modify` + `gmail.send` + `spreadsheets`, mismos riesgos y mitigaciones.

## Diferencias específicas de este evento

| Aspecto | Valor |
|---|---|
| Ruta de la página | `/agendamientos-artistas-comercial` (usada por el CTA de la card "Artistas" del hub `/agendamientos`) |
| Cuenta / event type de Calendly | **Propia de este evento** (distinta de la de empresas y de la de estratégica). Bajo el correo corporativo. Constante nueva en `constantes.ts`: `CALENDLY_ARTISTAS_COMERCIAL` (hoy solo existe `CALENDLY_ARTISTAS`, ambigua — hay que desambiguarla). |
| Script de Apps Script | **Propio** (script por evento). Parsea solo el correo de Calendly de este event type. Independiente del de empresas y del de pago. |
| Sheet destino | Archivo **`artistas`** (audiencia artistas), **pestaña `comercial`**. La otra pestaña (`estrategica`) la usa el flujo de pago. Sheet por audiencia, pestaña por evento. |
| Preguntas custom de Calendly | A definir — determinan las columnas de la pestaña `comercial` y las anclas del parser. Probablemente distintas a las de empresas (aquí interesa el proyecto musical, redes, etc., no "empresa"). |
| Correo de branding | **Copy propio de artistas comercial** (distinto al de empresas y al de estratégica). |

## Estado de implementación

- [x] Ruta fija `/agendamientos-artistas-comercial` (enlazada desde el hub `/agendamientos`).
- [x] Arquitectura: hereda Opción B del flujo de empresas.
- [ ] Construir `/agendamientos-artistas-comercial.astro`: header propio + inline widget. Sin JS custom.
- [ ] Crear el event type/cuenta de Calendly para artistas comercial (bajo el correo corporativo) y definir sus preguntas custom.
- [ ] Agregar `CALENDLY_ARTISTAS_COMERCIAL` en `constantes.ts` (y desambiguar `CALENDLY_ARTISTAS`).
- [ ] Crear la Sheet `artistas` (o su pestaña `comercial`) con las columnas según las preguntas de Calendly.
- [ ] Crear el script de Apps Script (trigger temporal + parseo + Sheet + branding). Código espejo en `docs/`.
- [ ] Escribir el copy del correo de branding de artistas comercial.

## Qué falta decidir / confirmar

1. **Preguntas custom del event type** — definen columnas y parser. Distintas a las de empresas.
2. **Copy del correo de branding** de este evento.
3. **Cuenta Gmail de destino** — confirmar que la notificación de Calendly de este event type cae en el Gmail donde corre el script (recipiente directo o forwarder), igual que en empresas.
4. **Estética del embed** — mismos parámetros de color que empresas, o default.
