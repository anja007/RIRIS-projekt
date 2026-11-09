import { config } from './config';
import { connectDb } from './db';
import { createApp } from './app';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Zaledje teče na http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
