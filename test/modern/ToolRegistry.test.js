const fs = require('fs');
const path = require('path');
const tools = require('../../src/tools/manifest');
const { toolDefinitions } = require('../../src/tools/tool-definitions');
const { toolRegistry } = require('../../src/tools/registry');

describe('Tool registry consistency', () => {
  test('manifest names and registry keys stay in sync', () => {
    const manifestNames = tools.map((tool) => tool.function.name).sort();
    const definitionNames = toolDefinitions.map((tool) => tool.name).sort();
    const registryNames = Object.keys(toolRegistry).sort();

    expect(manifestNames).toEqual(definitionNames);
    expect(registryNames).toEqual(definitionNames);
  });

  test('every tool definition points at an existing handler file', () => {
    const missingHandlers = toolDefinitions
      .filter((tool) => {
        const filePath = path.join(__dirname, '../../src/tools', `${tool.handlerPath}.js`);
        return !fs.existsSync(filePath);
      })
      .map((tool) => tool.name);

    expect(missingHandlers).toEqual([]);
  });

  test('every mapped registry entry is callable', () => {
    const uncallable = Object.entries(toolRegistry)
      .filter(([, handler]) => typeof handler !== 'function')
      .map(([name]) => name);

    expect(uncallable).toEqual([]);
  });
});
