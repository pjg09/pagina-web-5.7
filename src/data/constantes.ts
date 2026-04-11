// CONTACTO 
export const WHATSAPP_1 = "https://wa.me/573212865200";
export const WHATSAPP_2 = "https://wa.me/573125448302";
export const EMAIL = "contacto@ocl57group.com";
export const INSTAGRAM = "https://instagram.com/ondacreativalaunch5.7";

// Mensaje por defecto para CTA WhatsApp general
export const WHATSAPP_DEFAULT_MSG = encodeURIComponent(
    "Hola, quiero conocer más sobre los servicios de 5.7 / Onda Creativa Launch."
);
export const WHATSAPP_CTA = `${WHATSAPP_1}?text=${WHATSAPP_DEFAULT_MSG}`;

// CALENDLY 
// TODO: reemplazar con links reales de Calendly al configurar
export const CALENDLY_ARTISTAS = "https://calendly.com/TU_USUARIO/asesoria-artistas";
export const CALENDLY_EMPRESAS = "https://calendly.com/TU_USUARIO/diagnostico-empresas";

// MERCADOPAGO
// TODO: reemplazar con link real de pago al configurar MercadoPago
export const MP_ASESORIA_ARTISTAS = "https://mpago.la/TU_LINK_DE_PAGO";

// PRECIOS 
export const PRECIO_COP = "$150.000 COP";
export const PRECIO_USD = "~$50 USD";

// NAVEGACIÓN 
export const NAV_LINKS = [
    { label: "Inicio", href: "/" },
    { label: "Empresas", href: "/empresas" },
    { label: "Artistas", href: "/artistas" },
    { label: "Agendamientos", href: "/agendamientos" },
    { label: "Contacto", href: "/contacto" },
];

// MAKE WEBHOOK 
// TODO: reemplazar con URL real del webhook de Make al configurar
export const MAKE_WEBHOOK_FORMULARIO = "https://hook.make.com/TU_WEBHOOK_FORMULARIO";