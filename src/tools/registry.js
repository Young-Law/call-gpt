const path = require('path');
const { toolDefinitions } = require('./tool-definitions');

function lazyHandler(handlerPath) {
  const modulePath = path.join(__dirname, handlerPath);
  return (...args) => {
    const handler = require(modulePath);
    return handler(...args);
  };
}

const toolRegistry = toolDefinitions.reduce((registry, definition) => {
  registry[definition.name] = lazyHandler(definition.handlerPath);
  return registry;
}, {});

module.exports = { toolRegistry };
