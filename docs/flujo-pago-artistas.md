> [!WARNING]
> **DESACTUALIZADO — requiere revisión**
> Este documento refleja el diseño propuesto, no el estado de implementación real. Las páginas `/formulario`, `/resumen` y `/agendamientos` están pendientes de construcción. El script de Apps Script y las URLs de Wompi/Calendly aún no existen. Verificar contra el código y `constantes.ts` antes de usar como referencia.

# Flujo de pago y agendamiento — Asesoría estratégica para artistas

## Resumen del flujo

El artista paga, recibe un correo con un enlace personal, llena un formulario con información de su proyecto, elige la fecha de su sesión y queda confirmado automáticamente. El equipo no necesita intervenir manualmente en ningún paso.

---

## Diagrama completo

```
[/artistas] — sección asesoría estratégica
    ↓
Artista hace clic en "Pagar asesoría"
    ↓
Procesador de pago (Wompi)
    ↓
Pago aprobado
    ↓
Apps Script detecta el pago (webhook de Wompi → doPost)
    ↓
Apps Script genera token único (UUID) y lo guarda en Google Sheets
junto con: payment_id, email del artista, monto, timestamp
    ↓
Apps Script envía correo al artista (MailApp):
"Tu pago fue recibido. Accede aquí para completar tu agendamiento"
Enlace: https://sitio.com/formulario?token=UUID
    ↓
Artista abre el correo y hace clic
    ↓
[/formulario?token=UUID]
Apps Script valida que el token existe y no fue usado antes
    ↓
Artista llena el formulario:
nombre artístico, redes sociales, plataformas musicales,
descripción del proyecto, objetivos actuales
    ↓
Formulario envía datos + token al webhook de Apps Script
Apps Script registra en Google Sheets cruzando con el pago
    ↓
Artista es redirigido a Calendly con token como parámetro
    ↓
Artista elige fecha y hora disponible → agenda su sesión
    ↓
Calendly notifica a Apps Script (webhook de Calendly → doPost)
Apps Script cruza los tres registros: pago + formulario + agendamiento
    ↓
Apps Script envía correo de confirmación al artista con:
fecha, hora y enlace de la sesión
    ↓
Apps Script envía notificación al equipo con:
datos del formulario + comprobante de pago + comprobante de reserva
    ↓
[/resumen]
Artista ve el resumen de su sesión agendada y se le abre un CTA a WhatsApp opcional para que confirme su reunion
```

---

## Actores y responsabilidades

| Actor | Qué hace |
|-------|----------|
| **Artista** | Paga, abre el correo, llena el formulario, elige fecha |
| **Apps Script** | Detecta el pago, genera el token, envía correos, correlaciona datos, notifica al equipo |
| **Wompi** | Cobra y notifica el pago aprobado a Apps Script |
| **Calendly** | Muestra disponibilidad, registra el agendamiento, notifica a Apps Script |
| **Google Sheets** | Almacena y correlaciona todos los registros del flujo |
| **Equipo 5.7** | Recibe notificación y conduce la sesión — no interviene en el proceso |

---

## Páginas involucradas en el sitio

| Página | Rol en el flujo |
|--------|----------------|
| `/artistas` | Presenta la asesoría, muestra normativas, botón de pago |
| `/formulario?token=UUID` | Recibe al artista después del pago, captura datos del proyecto |
| `/resumen` | Página final con el resumen de la sesión agendada |

---

## Webhooks recibidos por Apps Script (un solo Web App, tres flujos)

Apps Script se publica como **un único Web App** (una sola URL de `doPost`). Como no tiene conectores nativos por proveedor, el propio script debe identificar de cuál de los tres orígenes viene cada llamada — por la forma del payload JSON o por un parámetro distinto en la URL de cada webhook (ej. `?origen=wompi`, `?origen=formulario`, `?origen=calendly`) — y ejecutar la lógica correspondiente.

### Webhook 1 — Pago aprobado
**Origen:** Wompi (evento `transaction.updated`, `data.transaction.status = "APPROVED"` — confirmar nombre exacto del evento contra la documentación oficial de Wompi al implementar)

**Acciones del script:**
1. Extrae: `payment_id` (referencia de transacción de Wompi), email del comprador, monto, timestamp
2. Genera UUID único (token) con `Utilities.getUuid()`
3. Guarda en Google Sheets: `token | payment_id | email | monto | timestamp | estado: pendiente_formulario`
4. Envía correo al artista con el enlace `/formulario?token=UUID` vía `MailApp.sendEmail()`

### Webhook 2 — Formulario enviado
**Origen:** POST del formulario del sitio al Web App de Apps Script

**Acciones del script:**
1. Recibe: `token` + campos del formulario
2. Busca el token en Google Sheets → valida que exista y esté en estado `pendiente_formulario`
3. Actualiza el registro con los datos del formulario y cambia estado a `pendiente_agendamiento`
4. Redirige al artista a Calendly con el token como parámetro

### Webhook 3 — Sesión agendada en Calendly
**Origen:** Calendly (`invitee.created`)

**Acciones del script:**
1. Recibe: datos del agendamiento + token (vía `utm_content`)
2. Busca el token en Google Sheets → cruza con pago y formulario
3. Actualiza el registro con fecha, hora y enlace de la sesión. Estado: `completo`
4. Envía correo de confirmación al artista
5. Envía notificación consolidada al equipo con todos los datos

---

## Seguridad del token

El token UUID reemplaza al `payment_id` crudo en la URL por tres razones:

1. **No predecible:** un UUID aleatorio no puede adivinarse ni construirse
2. **De un solo uso:** Apps Script lo invalida después de que el formulario es enviado
3. **Trazable:** cada token está vinculado a un pago real en Google Sheets

Si alguien intenta acceder a `/formulario` sin un token válido, la página muestra un mensaje de error y no permite continuar.

---

## Casos edge

| Situación | Qué ocurre |
|-----------|-----------|
| Artista paga pero no abre el correo | Apps Script tiene el registro del pago. El equipo puede reenviar el correo manualmente o contactar al artista |
| Artista abre el formulario pero no lo completa | El token sigue válido. El artista puede volver al enlace del correo y retomar |
| Artista llena el formulario pero no agenda en Calendly | Apps Script tiene pago + formulario. El equipo agenda manualmente o reenvía el link de Calendly |
| El correo llega a spam | El artista puede escribir al equipo por WhatsApp para recibir el enlace directamente |
| Token inválido o expirado | La página `/formulario` muestra mensaje de error con opción de contactar al equipo |

---

## Datos que fluyen por el sistema

### De Wompi a Apps Script
- `payment_id` — identificador único del pago
- Email del comprador
- Monto pagado
- Timestamp del pago
- Estado del pago

### Del formulario a Apps Script
- Token UUID
- Nombre artístico
- Redes sociales (Instagram, TikTok)
- Plataformas musicales (YouTube, Spotify)
- Descripción del proyecto (país, género, trayectoria, logros)
- Objetivos actuales

### De Calendly a Apps Script
- Token UUID (vía `utm_content`)
- Fecha y hora de la sesión
- Enlace de la videollamada
- Nombre e email del invitado

---

## Registro en Google Sheets

Cada fila en Google Sheets representa un artista que completó (o intentó) el flujo. Las columnas se llenan progresivamente:

| token | payment_id | email | monto | nombre_artistico | redes | plataformas | descripcion | objetivos | fecha_sesion | enlace_sesion | estado |
|-------|-----------|-------|-------|-----------------|-------|-------------|-------------|-----------|-------------|--------------|--------|
| UUID | WOMPI-XXX | arte@... | 150000 | DJ Ejemplo | @djej | Spotify/... | Artista de... | Crecer en... | 2026-05-10 10:00 | meet.google... | completo |
