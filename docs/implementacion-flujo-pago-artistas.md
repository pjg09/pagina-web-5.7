> [!WARNING]
> **DESACTUALIZADO — requiere revisión**
> Este documento es una guía de implementación aún no ejecutada. Ningún paso ha sido completado: no existe el Google Sheets, no están configurados los escenarios de Make, y las constantes en `constantes.ts` siguen siendo placeholders. Usar como punto de partida, no como estado actual.

# Implementación del flujo de pago y agendamiento — Asesoría artistas

## Prerrequisitos antes de empezar

- [ ] Cuenta de Make activa con plan que permita webhooks
- [ ] Cuenta de MercadoPago del cliente con acceso al panel
- [ ] Cuenta de Calendly del cliente con el evento de asesoría creado
- [ ] Google Sheets creado y compartido con Make
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
6. Copiar la URL del webhook (se usará en Make en el Paso 4)

---

## Paso 3 — Configurar MercadoPago

1. Ingresar al panel de MercadoPago del cliente
2. Ir a **"Tu negocio" → "Cobros" → "Links de pago"**
3. Crear o editar el link de asesoría estratégica:
   - Monto: $150.000 COP
   - Descripción: "Asesoría estratégica 5.7 / Onda Creativa Launch"
   - **"¿Qué pasa después del pago?"** → Seleccionar "Redirigir a una URL externa"
   - URL de redirección: dejar vacía por ahora (Make maneja el correo)
4. Copiar el link de pago generado (ej: `https://mpago.la/XXXXX`)
5. Ir a **"Tu negocio" → "Configuración" → "Webhooks"**
6. Crear webhook apuntando a la URL que generará Make en el Paso 4
7. Seleccionar el evento: `payment`

---

## Paso 4 — Configurar Make (tres escenarios)

### Escenario 1: Pago aprobado → generar token → enviar correo

1. Crear nuevo escenario en Make
2. **Trigger:** módulo "MercadoPago" → evento "Watch Payments"
   - Filtrar: solo pagos con `status = approved`
3. **Módulo 2:** "Tools" → "Set Variable"
   - Nombre: `token`
   - Valor: usar función `uuid()` de Make para generar UUID único
4. **Módulo 3:** "Google Sheets" → "Add a Row"
   - Hoja: `agendamientos_artistas`
   - Mapear columnas: `token`, `payment_id`, `email`, `monto`, `estado: pendiente_formulario`, `timestamp_pago`
5. **Módulo 4:** "Email" (o Gmail) → "Send an Email"
   - Para: email del comprador (del paso del pago)
   - Asunto: "Tu pago fue recibido — Completa tu agendamiento"
   - Cuerpo: incluir enlace `https://DOMINIO.com/formulario?token={{token}}`
6. Guardar y **activar** el escenario
7. Copiar la URL del webhook de Make y pegarla en el panel de MercadoPago (Paso 3)

### Escenario 2: Formulario enviado → registrar datos

1. Crear nuevo escenario en Make
2. **Trigger:** "Webhooks" → "Custom webhook"
   - Copiar la URL generada — esta es `MAKE_WEBHOOK_FORMULARIO` que va en `constantes.ts`
3. **Módulo 2:** "Google Sheets" → "Search Rows"
   - Buscar la fila donde `token = {{token del webhook}}`
   - Verificar que `estado = pendiente_formulario`
4. **Módulo 3:** "Google Sheets" → "Update a Row"
   - Actualizar la fila encontrada con: nombre_artistico, redes, plataformas, descripcion, objetivos
   - Cambiar `estado` a `pendiente_agendamiento`
   - Registrar `timestamp_formulario`
5. Guardar y activar el escenario

### Escenario 3: Sesión agendada → confirmar y notificar

1. Crear nuevo escenario en Make
2. **Trigger:** "Calendly" → "Watch Events" → evento `invitee.created`
3. **Módulo 2:** "Google Sheets" → "Search Rows"
   - Buscar la fila donde `token = {{utm_content del evento de Calendly}}`
4. **Módulo 3:** "Google Sheets" → "Update a Row"
   - Actualizar con: `fecha_sesion`, `enlace_sesion`
   - Cambiar `estado` a `completo`
   - Registrar `timestamp_agendamiento`
5. **Módulo 4:** "Email" → enviar correo de confirmación al artista
   - Asunto: "Tu sesión está confirmada — Asesoría estratégica 5.7"
   - Incluir: fecha, hora y enlace de la videollamada
6. **Módulo 5:** "Email" → enviar notificación al equipo
   - Asunto: "Nueva asesoría agendada — {{nombre_artistico}}"
   - Incluir: todos los datos del Google Sheets (pago + formulario + agendamiento)
7. Guardar y activar el escenario

---

## Paso 5 — Actualizar constantes.ts

Con los links ya generados, actualizar `src/data/constantes.ts`:

```typescript
// MercadoPago — reemplazar con el link real del Paso 3
export const MP_ASESORIA_ARTISTAS = "https://mpago.la/LINK_REAL";

// Calendly — reemplazar con el link real del evento
export const CALENDLY_ARTISTAS = "https://calendly.com/USUARIO/asesoria-artistas";

// Make webhook — reemplazar con la URL del Escenario 2
export const MAKE_WEBHOOK_FORMULARIO = "https://hook.make.com/WEBHOOK_REAL";
```

---

## Paso 6 — Construir formulario.astro

La página `/formulario` debe:

1. Leer el parámetro `token` de la URL
2. Si no hay token o el token es inválido → mostrar mensaje de error con opción de contactar al equipo
3. Si el token es válido → mostrar el formulario con los campos del proyecto
4. Al enviar → hacer POST al `MAKE_WEBHOOK_FORMULARIO` con token + datos
5. Al recibir respuesta exitosa → redirigir a Calendly con el token: `CALENDLY_ARTISTAS?utm_content=TOKEN`

**Validación del token desde el frontend:**
Sin backend, la validación real del token ocurre en Make (Escenario 2). El frontend solo verifica que el parámetro `token` exista en la URL antes de mostrar el formulario. La validación de que el token es legítimo la hace Make al procesar el POST.

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

1. [ ] Hacer un pago de prueba en MercadoPago (sandbox)
2. [ ] Verificar que Make crea la fila en Google Sheets
3. [ ] Verificar que el correo llega con el enlace correcto
4. [ ] Abrir el enlace → verificar que `/formulario?token=UUID` carga correctamente
5. [ ] Llenar y enviar el formulario
6. [ ] Verificar que Make actualiza la fila en Google Sheets
7. [ ] Verificar que la redirección a Calendly incluye el token en `utm_content`
8. [ ] Agendar una sesión de prueba en Calendly
9. [ ] Verificar que Make recibe el webhook de Calendly y completa la fila
10. [ ] Verificar que el artista recibe el correo de confirmación
11. [ ] Verificar que el equipo recibe la notificación consolidada
12. [ ] Verificar que `/resumen` carga correctamente

---

## Variables y URLs de referencia

| Variable | Dónde vive | Estado |
|----------|-----------|--------|
| `MP_ASESORIA_ARTISTAS` | `constantes.ts` | Pendiente — necesita link real de MercadoPago |
| `CALENDLY_ARTISTAS` | `constantes.ts` | Pendiente — necesita link real de Calendly |
| `MAKE_WEBHOOK_FORMULARIO` | `constantes.ts` | Pendiente — se genera al crear el Escenario 2 en Make |
| Webhook MercadoPago → Make | Panel de MercadoPago | Pendiente — se configura con la URL del Escenario 1 |
| Webhook Calendly → Make | Panel de Calendly | Pendiente — se configura con la URL del Escenario 3 |
| Google Sheets ID | Make (interno) | Pendiente — se crea en el Paso 1 |

---

## Orden recomendado de implementación

1. Google Sheets (Paso 1) — sin dependencias
2. Calendly (Paso 2) — sin dependencias de código
3. Make Escenario 2 (Paso 4) — genera la URL del webhook del formulario
4. Actualizar `constantes.ts` con la URL del webhook (Paso 5)
5. Construir `formulario.astro` (Paso 6)
6. Construir `resumen.astro` (Paso 7)
7. MercadoPago (Paso 3) — necesita el dominio real en producción
8. Make Escenario 1 (Paso 4) — necesita el webhook de MercadoPago
9. Make Escenario 3 (Paso 4) — necesita el webhook de Calendly
10. Actualizar artistas.astro (Paso 8)
11. Prueba completa (Paso 9)
