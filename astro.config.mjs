import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// strictPort matters: without it Astro silently moves to the next free port when
// 4321 is taken, and any test or script pointed at 4321 then hits whatever else
// is listening there. Fail loudly instead. Override with PORT=... if you must.
export default defineConfig({
  integrations: [react()],
  server: {
    port: Number(process.env.PORT ?? 4321),
    host: false,
  },
  vite: {
    server: { strictPort: true },
  },
});
