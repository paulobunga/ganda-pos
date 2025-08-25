import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
            registerType: 'autoUpdate',
            srcDir: 'src',
            filename: 'sw.ts',
            strategies: 'injectManifest',
            devOptions: {
                enabled: true,
                type: 'module',
            },
			manifest: {
				name: 'Svelte POS',
				short_name: 'SveltePOS',
				description: 'A simple POS system built with SvelteKit.',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'favicon.png', // Using existing favicon as a placeholder
						sizes: '192x192',
						type: 'image/png'
					},
                    {
						src: 'favicon.png', // Using existing favicon as a placeholder
						sizes: '512x512',
						type: 'image/png'
					}
				]
			}
		})
	]
});
