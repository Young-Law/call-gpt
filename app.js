require('dotenv').config();
require('colors');
const express = require('express');
const expressWs = require('express-ws');
const { incomingRouter } = require('./src/http/incomingRouter');
const { registerConnectionRoute } = require('./src/http/connectionRouter');
const { validateEnv } = require('./src/config/env');


try {
  validateEnv();
} catch (error) {
  console.error(`Configuration error: ${error.message}`);
  process.exit(1);
}

const app = express();
const wsInstance = expressWs(app);
const PORT = process.env.PORT || 8080;

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.use(incomingRouter);
registerConnectionRoute(app, wsInstance);

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = () => {
  console.log('Shutting down server...'.yellow);
  server.close(() => {
    console.log('Server closed.'.yellow);
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
