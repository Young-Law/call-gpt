const { tools } = require('../../../src/tools/tool-definitions');
const { getToolHandler, getRegisteredToolNames } = require('../../../src/tools/registry');

describe('tool handler contracts', () => {
  test('every tool has a handler function', () => {
    for (const tool of tools) {
      const name = tool.function.name;
      expect(typeof getToolHandler(name)).toBe('function');
    }
  });

  test('registered handler names match tool manifest names', () => {
    const names = tools.map((tool) => tool.function.name);
    expect(getRegisteredToolNames().sort()).toEqual(names.sort());
  });
});
