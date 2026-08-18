import closeWithGrace from 'close-with-grace';
import { buildApp } from './app.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST ?? '0.0.0.0';

const app = buildApp();

closeWithGrace({ delay: 500 }, async ({ err, signal }) => {
  if (err) {
    app.log.error({ err }, 'server closing due to error');
  } else {
    app.log.info({ signal }, 'server closing gracefully');
  }
  await app.close();
});

try {
  await app.listen({ port: PORT, host: HOST });
} catch (err) {
  app.log.error({ err }, 'failed to start server');
  process.exit(1);
}
