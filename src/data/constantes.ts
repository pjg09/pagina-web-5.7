// CONTACTO 
export const WHATSAPP_1 = "https://wa.me/573212865200";
export const WHATSAPP_2 = "https://wa.me/573125448302";
export const EMAIL = "contacto@ocl57group.com";
export const INSTAGRAM = "https://instagram.com/ondacreativalaunch5.7";
export const FACEBOOK = "https://facebook.com/ondacreativalaunch5.7";
export const TIKTOK = "https://tiktok.com/@ondacreativalaunch5.7";

// Mensaje por defecto para CTA WhatsApp general
export const WHATSAPP_DEFAULT_MSG = encodeURIComponent(
    "Hola, quiero conocer más sobre los servicios de 5.7 / Onda Creativa Launch."
);
export const WHATSAPP_CTA = `${WHATSAPP_1}?text=${WHATSAPP_DEFAULT_MSG}`;

// CALENDLY 
// TODO: reemplazar con links reales de Calendly al configurar
export const CALENDLY_ARTISTAS = "https://calendly.com/TU_USUARIO/asesoria-artistas";
export const CALENDLY_EMPRESAS = "https://calendly.com/TU_USUARIO/diagnostico-empresas";

// WOMPI
// TODO: reemplazar con link real de pago al configurar Wompi
export const WOMPI_ASESORIA_ARTISTAS = "https://checkout.wompi.co/l/TU_LINK_DE_PAGO";

// PRECIOS 
export const PRECIO_COP = "$150.000 COP";
export const PRECIO_USD = "~$50 USD";

// NAVEGACIÓN 
export const NAV_LINKS = [
    { label: "Inicio", href: "/" },
    { label: "Empresas", href: "/empresas" },
    { label: "Artistas", href: "/artistas" },
    { label: "Seguridad VIP", href: "/seguridad-movilidad" },
    { label: "Agendamientos", href: "/agendamientos" },
    { label: "Contacto", href: "/contacto" },
];

// APPS SCRIPT WEBHOOK
// TODO: reemplazar con la URL real del Web App al publicarlo en Apps Script
export const APPSCRIPT_WEBHOOK_FORMULARIO = "https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec?origen=formulario";

// Web App dedicado al formulario de contacto.astro (script independiente del de arriba)
export const URL_APP_WEB_CONTACTO = "https://script.google.com/macros/s/AKfycbyJDWeZOHuDDD82Mqrr7EZfiarIAQvJGIOtmT4VWwrJht2fIfaIm5fvupr_iW1KeKXC/exec";