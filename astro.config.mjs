import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://ocl57group.com',
    integrations: [
        sitemap({
            // Excluir del sitemap las páginas aún no listas para indexar.
            filter: (page) =>
                !page.includes('/formulario') && !page.includes('/resumen'),
        }),
    ],
});
