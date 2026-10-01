import { serve } from '@hono/node-server';
import app from './index.js';
import { config } from './config.js';

const port = config.PORT;

console.log(`Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server running at http://localhost:${info.port}`);
});
