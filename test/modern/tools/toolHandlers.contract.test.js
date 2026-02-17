const { toolHandlers, tools } = require('../../../src/tools/tool-definitions');

describe('tool handler contracts', () => {
  test('every tool has a handler function', () => {
    for (const tool of tools) {
      const name = tool.function.name;
      expect(typeof toolHandlers[name]).toBe('function');
    }
  });

  test('handler names match tool manifest names', () => {
    const names = tools.map((tool) => tool.function.name);
    expect(Object.keys(toolHandlers).sort()).toEqual(names.sort());
  });
});
