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
Procesador de pago (MercadoPago o Stripe)
    ↓
Pago aprobado
    ↓
Make detecta el pago (webhook del procesador)
    ↓
Make genera token único (UUID) y lo guarda en Google Sheets
junto con: payment_id, email del artista, monto, timestamp
    ↓
Make envía correo al artista:
"Tu pago fue recibido. Accede aquí para completar tu agendamiento"
Enlace: https://sitio.com/formulario?token=UUID
    ↓
Artista abre el correo y hace clic
    ↓
[/formulario?token=UUID]
Make valida que el token existe y no fue usado antes
    ↓
Artista llena el formulario:
nombre artístico, redes sociales, plataformas musicales,
descripción del proyecto, objetivos actuales
    ↓
Formulario envía datos + token al webhook de Make
Make registra en Google Sheets cruzando con el pago
    ↓
Artista es redirigido a Calendly con token como parámetro
    ↓
Artista elige fecha y hora disponible → agenda su sesión
    ↓
Calendly notifica a Make (webhook de Calendly)
Make cruza los tres registros: pago + formulario + agendamiento
    ↓
Make envía correo de confirmación al artista con:
fecha, hora y enlace de la sesión
    ↓
Make envía notificación al equipo con:
datos del formulario + comprobante de pago + comprobante de reserva
    ↓
[/resumen]
Artista ve el resumen de su sesión agendada
```

---

## Actores y responsabilidades

| Actor | Qué hace |
|-------|----------|
| **Artista** | Paga, abre el correo, llena el formulario, elige fecha |
| **Make** | Detecta el pago, genera el token, envía correos, correlaciona datos, notifica al equipo |
| **Procesador de pago** | Cobra y notifica el pago aprobado a Make |
| **Calendly** | Muestra disponibilidad, registra el agendamiento, notifica a Make |
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

## Webhooks en Make (tres escenarios)

### Webhook 1 — Pago aprobado
**Trigger:** MercadoPago (`payment.created` con status `approved`) o Stripe (`checkout.session.completed`)

**Acciones de Make:**
1. Extrae: `payment_id`, email del comprador, monto, timestamp
2. Genera UUID único (token)
3. Guarda en Google Sheets: `token | payment_id | email | monto | timestamp | estado: pendiente_formulario`
4. Envía correo al artista con el enlace `/formulario?token=UUID`

### Webhook 2 — Formulario enviado
**Trigger:** POST del formulario al webhook de Make

**Acciones de Make:**
1. Recibe: `token` + campos del formulario
2. Busca el token en Google Sheets → valida que exista y esté en estado `pendiente_formulario`
3. Actualiza el registro con los datos del formulario y cambia estado a `pendiente_agendamiento`
4. Redirige al artista a Calendly con el token como parámetro

### Webhook 3 — Sesión agendada en Calendly
**Trigger:** Calendly (`invitee.created`)

**Acciones de Make:**
1. Recibe: datos del agendamiento + token (vía `utm_content`)
2. Busca el token en Google Sheets → cruza con pago y formulario
3. Actualiza el registro con fecha, hora y enlace de la sesión. Estado: `completo`
4. Envía correo de confirmación al artista
5. Envía notificación consolidada al equipo con todos los datos

---

## Seguridad del token

El token UUID reemplaza al `payment_id` crudo en la URL por tres razones:

1. **No predecible:** un UUID aleatorio no puede adivinarse ni construirse
2. **De un solo uso:** Make lo invalida después de que el formulario es enviado
3. **Trazable:** cada token está vinculado a un pago real en Google Sheets

Si alguien intenta acceder a `/formulario` sin un token válido, la página muestra un mensaje de error y no permite continuar.

---

## Compatibilidad con procesadores de pago

El flujo es idéntico para MercadoPago y Stripe. La única diferencia está en el trigger del Webhook 1 en Make:

| Procesador | Trigger en Make | Evento |
|------------|----------------|--------|
| MercadoPago | Módulo MercadoPago nativo | `payment.created` (status: approved) |
| Stripe | Módulo Stripe nativo | `checkout.session.completed` |

Al agregar Stripe en el futuro, se añade un segundo trigger en el mismo escenario de Make. El resto del flujo no cambia.

---

## Casos edge

| Situación | Qué ocurre |
|-----------|-----------|
| Artista paga pero no abre el correo | Make tiene el registro del pago. El equipo puede reenviar el correo manualmente o contactar al artista |
| Artista abre el formulario pero no lo completa | El token sigue válido. El artista puede volver al enlace del correo y retomar |
| Artista llena el formulario pero no agenda en Calendly | Make tiene pago + formulario. El equipo agenda manualmente o reenvía el link de Calendly |
| El correo llega a spam | El artista puede escribir al equipo por WhatsApp para recibir el enlace directamente |
| Token inválido o expirado | La página `/formulario` muestra mensaje de error con opción de contactar al equipo |

---

## Datos que fluyen por el sistema

### Del procesador de pago a Make
- `payment_id` — identificador único del pago
- Email del comprador
- Monto pagado
- Timestamp del pago
- Estado del pago

### Del formulario a Make
- Token UUID
- Nombre artístico
- Redes sociales (Instagram, TikTok)
- Plataformas musicales (YouTube, Spotify)
- Descripción del proyecto (país, género, trayectoria, logros)
- Objetivos actuales

### De Calendly a Make
- Token UUID (vía `utm_content`)
- Fecha y hora de la sesión
- Enlace de la videollamada
- Nombre e email del invitado

---

## Registro en Google Sheets

Cada fila en Google Sheets representa un artista que completó (o intentó) el flujo. Las columnas se llenan progresivamente:

| token | payment_id | email | monto | nombre_artistico | redes | plataformas | descripcion | objetivos | fecha_sesion | enlace_sesion | estado |
|-------|-----------|-------|-------|-----------------|-------|-------------|-------------|-----------|-------------|--------------|--------|
| UUID | MP-XXX | arte@... | 150000 | DJ Ejemplo | @djej | Spotify/... | Artista de... | Crecer en... | 2026-05-10 10:00 | meet.google... | completo |
