const { encodeCommand, parseRedisUrl, getAuthArgs } = require('../../src/state/RedisSessionStore');

describe('RedisSessionStore helpers', () => {
  test('encodeCommand builds RESP payload', () => {
    const payload = encodeCommand(['SET', 'session:abc', '{"ok":true}', 'EX', 60]);
    expect(payload).toBe('*5\r\n$3\r\nSET\r\n$11\r\nsession:abc\r\n$11\r\n{"ok":true}\r\n$2\r\nEX\r\n$2\r\n60\r\n');
  });

  test('parseRedisUrl decodes username and password', () => {
    const parsed = parseRedisUrl('redis://user%40name:p%40ss%3Aword@localhost:6380/0');
    expect(parsed).toEqual({
      host: 'localhost',
      port: 6380,
      username: 'user@name',
      password: 'p@ss:word',
    });
  });

  test('getAuthArgs handles ACL and password-only auth', () => {
    expect(getAuthArgs('default', 'secret')).toEqual(['AUTH', 'default', 'secret']);
    expect(getAuthArgs(null, 'secret')).toEqual(['AUTH', 'secret']);
    expect(getAuthArgs('ignored', '')).toBeNull();
  });
});
