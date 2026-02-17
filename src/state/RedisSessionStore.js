const net = require('net');

const DEFAULT_CONNECT_TIMEOUT_MS = 5000;

function encodeCommand(args) {
  const chunks = [`*${args.length}\r\n`];
  args.forEach((arg) => {
    const value = String(arg);
    chunks.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
  });
  return chunks.join('');
}

function parseRedisUrl(redisUrlRaw) {
  const redisUrl = new URL(redisUrlRaw);
  const username = redisUrl.username ? decodeURIComponent(redisUrl.username) : null;
  const password = redisUrl.password ? decodeURIComponent(redisUrl.password) : null;

  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username,
    password,
  };
}

function getAuthArgs(username, password) {
  if (!password) {
    return null;
  }

  if (username) {
    return ['AUTH', username, password];
  }

  return ['AUTH', password];
}

class RedisSessionStore {
  constructor() {
    this.enabled = Boolean(process.env.REDIS_URL);
    this.socketOptions = null;
    this.authArgs = null;

    if (this.enabled) {
      const parsedRedis = parseRedisUrl(process.env.REDIS_URL);
      this.socketOptions = {
        host: parsedRedis.host,
        port: parsedRedis.port,
      };
      this.authArgs = getAuthArgs(parsedRedis.username, parsedRedis.password);
    }
  }

  async setSessionValue(sessionId, data, ttlSeconds = 3600) {
    if (!this.enabled || !sessionId) {
      return;
    }

    const commands = [];

    if (this.authArgs) {
      commands.push(encodeCommand(this.authArgs));
    }

    commands.push(encodeCommand([
      'SET',
      `session:${sessionId}`,
      JSON.stringify(data),
      'EX',
      String(ttlSeconds),
    ]));

    await this.send(commands.join(''));
  }

  async send(payload) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let responseBuffer = '';

      const finish = (handler, value) => {
        if (settled) {
          return;
        }

        settled = true;
        socket.end();
        handler(value);
      };

      const socket = net.createConnection(this.socketOptions, () => {
        socket.setTimeout(DEFAULT_CONNECT_TIMEOUT_MS);
        socket.write(payload);
      });

      socket.on('data', (buffer) => {
        responseBuffer += buffer.toString();

        if (responseBuffer.startsWith('-')) {
          finish(reject, new Error(`Redis error response: ${responseBuffer.trim()}`));
          return;
        }

        const lines = responseBuffer.split('\r\n').filter(Boolean);
        const hasErrorReply = lines.some((line) => line.startsWith('-'));
        if (hasErrorReply) {
          const errorLine = lines.find((line) => line.startsWith('-'));
          finish(reject, new Error(`Redis error response: ${errorLine}`));
          return;
        }

        const expectedReplies = this.authArgs ? 2 : 1;
        const completeReplies = lines.filter((line) => line.startsWith('+') || line.startsWith('-')).length;

        if (completeReplies >= expectedReplies) {
          finish(resolve, responseBuffer);
        }
      });

      socket.on('timeout', () => {
        finish(reject, new Error(`Redis connection timeout after ${DEFAULT_CONNECT_TIMEOUT_MS}ms`));
      });

      socket.on('error', (error) => {
        finish(reject, error);
      });

      socket.on('close', () => {
        if (!settled) {
          finish(reject, new Error('Redis connection closed before response was received'));
        }
      });
    });
  }
}

module.exports = {
  RedisSessionStore,
  encodeCommand,
  parseRedisUrl,
  getAuthArgs,
};
