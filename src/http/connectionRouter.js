const express = require('express');
const { CallSessionManager } = require('../session/CallSessionManager');

function registerConnectionRoute(app, expressWsInstance) {
  const connectionRouter = express.Router();
  expressWsInstance.applyTo(connectionRouter);

  connectionRouter.ws('/connection', (ws) => {
    const sessionManager = new CallSessionManager(ws);
    sessionManager.initialize().catch((error) => {
      console.error('Failed to initialize call session:', error);
      ws.close();
    });
  });

  app.use(connectionRouter);
}

module.exports = { registerConnectionRoute };
