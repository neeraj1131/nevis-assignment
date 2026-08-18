import closeWithGrace from 'close-with-grace';
import { buildApp } from './app.js';
import { loadEnv } from './env.js';

const env = loadEnv();

const app = buildApp({ env });

closeWithGrace({ delay: 500 }, async ({ err, signal }) => {
  if (err) {
    app.log.error({ err }, 'server closing due to error');
  } else {
    app.log.info({ signal }, 'server closing gracefully');
  }
  await app.close();
});

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error({ err }, 'failed to start server');
  process.exit(1);
}
