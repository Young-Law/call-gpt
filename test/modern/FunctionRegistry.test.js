const tools = require('../../functions/function-manifest');
const { FUNCTION_MODULES, loadAvailableFunctions } = require('../../src/functions/registry');

describe('function registry', () => {
  test('includes explicit mappings for all manifest functions', () => {
    const manifestNames = tools.map((tool) => tool.function.name);
    expect(Object.keys(FUNCTION_MODULES).sort()).toEqual(manifestNames.sort());
  });

  test('loads callable handlers for every tool in the manifest', () => {
    const handlers = loadAvailableFunctions(tools);

    for (const name of tools.map((tool) => tool.function.name)) {
      expect(typeof handlers[name]).toBe('function');
    }
  });
});
