> [!WARNING]
> **DESACTUALIZADO — requiere revisión**
> Este documento es una guía de implementación aún no ejecutada. Ningún paso ha sido completado: no existe el Google Sheets, no está publicado el Web App de Apps Script, y las constantes en `constantes.ts` siguen siendo placeholders. Usar como punto de partida, no como estado actual.
>
> **⚠️ Correcciones vigentes que priman sobre estos pasos** (ver `flujo-pago-artistas.md` → "Ajustes por plan gratuito de Calendly", y el mapa en `flujo-agendamientos.md`):
> - **Calendly está en plan GRATUITO → no hay webhook.** Ignorar los pasos de "activar webhook" de Calendly (Paso 2, puntos 5–6) y la Función 3 basada en `invitee.created`. El agendamiento se detecta por **trigger temporal que parsea el correo de notificación** de Calendly.
> - **Token vía pregunta custom `a1=TOKEN`**, no `utm_content`.
> - **`GmailApp`** (sin `from` alias, con `replyTo`), no `MailApp`.
> - **Ruta de entrada:** `/agendamientos-artistas-estrategica` (no la sección de `/artistas`).
> - **Sheet:** archivo `artistas`, pestaña `estrategica`. Constante `CALENDLY_ARTISTAS_ESTRATEGICA`.
> - **Evento de Wompi:** `transaction.updated`/`APPROVED` sigue **sin confirmar** contra la doc oficial — es el próximo paso acordado.

# Implementación del flujo de pago y agendamiento — Asesoría artistas

## Prerrequisitos antes de empezar

- [ ] Cuenta de Google del cliente (la misma que es dueña del Google Sheets) con acceso a Apps Script
- [ ] Cuenta de Wompi del cliente con acceso al panel de comercio
- [ ] Cuenta de Calendly del cliente con el evento de asesoría creado
- [ ] Google Sheets creado, en la misma cuenta de Google donde se publicará el script
- [ ] Dominio real configurado en Vercel (necesario para las URLs de redirección)

---

## Paso 1 — Configurar Google Sheets

Crear una hoja llamada `agendamientos_artistas` con estas columnas exactas en la fila 1:

```
token | payment_id | email | monto | nombre_artistico | redes | plataformas | descripcion | objetivos | fecha_sesion | enlace_sesion | estado | timestamp_pago | timestamp_formulario | timestamp_agendamiento
```

El campo `estado` tendrá estos valores posibles:
- `pendiente_formulario` — pago recibido, artista aún no llenó el formulario
- `pendiente_agendamiento` — formulario enviado, artista aún no agendó
- `completo` — todo el flujo terminado

---

## Paso 2 — Configurar Calendly

1. Ingresar al panel de Calendly del cliente
2. Abrir el evento de asesoría estratégica
3. Ir a **"Confirmation page"** → seleccionar **"Redirect to an external website"**
4. Ingresar la URL: `https://DOMINIO.com/resumen`
5. En **"Notification and cancellation policy"** → activar webhook
6. Copiar la URL del webhook (se usará en el Paso 4, apuntando al Web App de Apps Script)

---

## Paso 3 — Configurar Wompi

1. Ingresar al panel de comercio de Wompi del cliente
2. Crear el link/widget de pago para la asesoría estratégica:
   - Monto: $150.000 COP
   - Descripción: "Asesoría estratégica 5.7 / Onda Creativa Launch"
   - Referencia: usar un identificador propio que luego llegue como `payment_id`
3. Copiar el link de pago generado
4. Ir a la sección de **eventos/webhooks** del panel de Wompi
5. Crear un webhook apuntando a la URL que generará el Web App de Apps Script (Paso 4)
6. Confirmar contra la documentación oficial de Wompi el nombre exacto del evento de pago aprobado (se documentó como `transaction.updated` con estado `APPROVED`, pero debe verificarse al momento de implementar)

---

## Paso 4 — Construir y publicar el Web App de Apps Script

A diferencia de una herramienta no-code, Apps Script no tiene conectores visuales por proveedor — todo el ruteo y la lógica se escriben a mano en un único proyecto de Apps Script, publicado como **un solo Web App** con una sola función `doPost(e)` de entrada.

### Estructura general del script

1. Crear el proyecto de Apps Script desde el propio Google Sheets (`Extensiones → Apps Script`), para que tenga acceso directo a la hoja sin configurar credenciales.
2. En `doPost(e)`, identificar el origen de la llamada (Wompi, formulario del sitio, o Calendly) — por un parámetro en la URL (`?origen=wompi`, `?origen=formulario`, `?origen=calendly`) o por la forma del payload JSON recibido.
3. Enrutar a una función distinta según el origen: `procesarPagoWompi(payload)`, `procesarFormulario(payload)`, `procesarAgendamiento(payload)`.
4. Publicar como Web App: `Implementar → Nueva implementación → Aplicación web` — ejecutar como "Yo" (el propietario), acceso "Cualquier usuario" (necesario para que Wompi/Calendly puedan llamarlo desde fuera).
5. Copiar la URL del Web App generada — es la misma URL que se usa en los tres webhooks (Wompi, formulario del sitio, Calendly), diferenciados por el parámetro `?origen=`.

### Función 1: Pago aprobado → generar token → enviar correo

`procesarPagoWompi(payload)` debe:
1. Verificar que el estado de la transacción sea aprobado
2. Extraer: `payment_id`, email del comprador, monto
3. Generar el token con `Utilities.getUuid()`
4. Escribir una fila nueva en `agendamientos_artistas` (`SpreadsheetApp.openById(...).appendRow(...)`): `token`, `payment_id`, `email`, `monto`, `estado: pendiente_formulario`, `timestamp_pago`
5. Enviar correo al artista con `MailApp.sendEmail()`:
   - Asunto: "Tu pago fue recibido — Completa tu agendamiento"
   - Cuerpo: incluir enlace `https://DOMINIO.com/formulario?token={token}`

### Función 2: Formulario enviado → registrar datos

`procesarFormulario(payload)` debe:
1. Recibir `token` + campos del formulario
2. Buscar en la hoja la fila donde `token` coincida y `estado = pendiente_formulario`
3. Si no existe o el estado no coincide, devolver un error (el frontend debe mostrarlo)
4. Actualizar la fila encontrada con: nombre_artistico, redes, plataformas, descripcion, objetivos
5. Cambiar `estado` a `pendiente_agendamiento` y registrar `timestamp_formulario`

### Función 3: Sesión agendada → confirmar y notificar

`procesarAgendamiento(payload)` debe:
1. Recibir los datos del evento de Calendly, incluyendo el token (vía `utm_content`)
2. Buscar la fila donde `token` coincida
3. Actualizar con `fecha_sesion`, `enlace_sesion`; cambiar `estado` a `completo`; registrar `timestamp_agendamiento`
4. Enviar correo de confirmación al artista (`MailApp.sendEmail()`):
   - Asunto: "Tu sesión está confirmada — Asesoría estratégica 5.7"
   - Incluir: fecha, hora y enlace de la videollamada
5. Enviar notificación al equipo (`MailApp.sendEmail()` a la dirección interna, o integrarlo con WhatsApp/Slack más adelante si se necesita):
   - Asunto: "Nueva asesoría agendada — {nombre_artistico}"
   - Incluir: todos los datos de la fila (pago + formulario + agendamiento)

---

## Paso 5 — Actualizar constantes.ts

Con los links ya generados, actualizar `src/data/constantes.ts`:

```typescript
// Wompi — reemplazar con el link real del Paso 3
export const WOMPI_ASESORIA_ARTISTAS = "https://checkout.wompi.co/l/LINK_REAL";

// Calendly — reemplazar con el link real del evento
export const CALENDLY_ARTISTAS = "https://calendly.com/USUARIO/asesoria-artistas";

// Apps Script Web App — reemplazar con la URL publicada en el Paso 4
export const APPSCRIPT_WEBHOOK_FORMULARIO = "https://script.google.com/macros/s/DEPLOYMENT_ID/exec?origen=formulario";
```

---

## Paso 6 — Construir formulario.astro

La página `/formulario` debe:

1. Leer el parámetro `token` de la URL
2. Si no hay token o el token es inválido → mostrar mensaje de error con opción de contactar al equipo
3. Si el token es válido → mostrar el formulario con los campos del proyecto
4. Al enviar → hacer POST al `APPSCRIPT_WEBHOOK_FORMULARIO` con token + datos
5. Al recibir respuesta exitosa → redirigir a Calendly con el token: `CALENDLY_ARTISTAS?utm_content=TOKEN`

**Validación del token desde el frontend:**
Sin backend, la validación real del token ocurre en Apps Script (Función 2). El frontend solo verifica que el parámetro `token` exista en la URL antes de mostrar el formulario. La validación de que el token es legítimo la hace Apps Script al procesar el POST.

**Campos del formulario:**
- Nombre artístico (texto, requerido)
- Redes sociales: Instagram y TikTok (texto, requerido)
- Plataformas musicales: YouTube y Spotify (texto, requerido)
- Descripción del proyecto (textarea, requerido) — país, género, trayectoria, logros
- Objetivos actuales (textarea, requerido)

---

## Paso 7 — Construir resumen.astro

La página `/resumen` es el destino final después de agendar en Calendly. Debe mostrar:

1. Confirmación visual de que todo quedó agendado
2. Fecha y hora de la sesión (si Calendly los pasa como URL params)
3. CTA secundario: botón de WhatsApp al equipo por si tiene dudas
4. Instrucciones de qué esperar antes de la sesión

---

## Paso 8 — Actualizar artistas.astro (sección 5)

El formulario en la sección 5C de artistas.astro pasa a ser **informativo**, no funcional:

- El paso 2 ("Formulario previo") muestra los campos que el artista deberá llenar **después del pago**, a modo de anticipo
- Los campos no tienen `name` ni `action` — son puramente visuales
- Se añade una nota explicativa: "Después de tu pago recibirás un correo con el enlace para completar este formulario"

---

## Paso 9 — Prueba del flujo completo

Ejecutar el flujo de prueba en este orden:

1. [ ] Hacer un pago de prueba en Wompi (entorno sandbox/pruebas de Wompi)
2. [ ] Verificar que Apps Script crea la fila en Google Sheets
3. [ ] Verificar que el correo llega con el enlace correcto
4. [ ] Abrir el enlace → verificar que `/formulario?token=UUID` carga correctamente
5. [ ] Llenar y enviar el formulario
6. [ ] Verificar que Apps Script actualiza la fila en Google Sheets
7. [ ] Verificar que la redirección a Calendly incluye el token en `utm_content`
8. [ ] Agendar una sesión de prueba en Calendly
9. [ ] Verificar que Apps Script recibe el webhook de Calendly y completa la fila
10. [ ] Verificar que el artista recibe el correo de confirmación
11. [ ] Verificar que el equipo recibe la notificación consolidada
12. [ ] Verificar que `/resumen` carga correctamente

---

## Variables y URLs de referencia

| Variable | Dónde vive | Estado |
|----------|-----------|--------|
| `WOMPI_ASESORIA_ARTISTAS` | `constantes.ts` | Pendiente — necesita link real de Wompi |
| `CALENDLY_ARTISTAS` | `constantes.ts` | Pendiente — necesita link real de Calendly |
| `APPSCRIPT_WEBHOOK_FORMULARIO` | `constantes.ts` | Pendiente — se genera al publicar el Web App en el Paso 4 |
| Webhook Wompi → Apps Script | Panel de Wompi | Pendiente — se configura con la URL del Web App (`?origen=wompi`) |
| Webhook Calendly → Apps Script | Panel de Calendly | Pendiente — se configura con la URL del Web App (`?origen=calendly`) |
| Google Sheets ID | Apps Script (`SpreadsheetApp.openById`) | Pendiente — se crea en el Paso 1 |

---

## Orden recomendado de implementación

1. Google Sheets (Paso 1) — sin dependencias
2. Calendly (Paso 2) — sin dependencias de código
3. Web App de Apps Script, Función 2 (Paso 4) — genera la URL del webhook del formulario
4. Actualizar `constantes.ts` con la URL del Web App (Paso 5)
5. Construir `formulario.astro` (Paso 6)
6. Construir `resumen.astro` (Paso 7)
7. Wompi (Paso 3) — necesita el dominio real en producción
8. Apps Script Función 1 (Paso 4) — necesita el webhook de Wompi configurado
9. Apps Script Función 3 (Paso 4) — necesita el webhook de Calendly configurado
10. Actualizar artistas.astro (Paso 8)
11. Prueba completa (Paso 9)
