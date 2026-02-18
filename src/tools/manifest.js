const { toolDefinitions } = require('./tool-definitions');

const tools = toolDefinitions.map((definition) => ({
  type: 'function',
  function: {
    name: definition.name,
    say: definition.say,
    description: definition.description,
    parameters: definition.parameters,
    returns: definition.returns,
  },
}));

module.exports = tools;
