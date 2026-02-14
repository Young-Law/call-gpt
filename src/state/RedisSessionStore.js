const net = require('net');

function encodeCommand(args) {
  const chunks = [`*${args.length}\r\n`];
  args.forEach((arg) => {
    const value = String(arg);
    chunks.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
  });
  return chunks.join('');
}

class RedisSessionStore {
  constructor() {
    this.enabled = Boolean(process.env.REDIS_URL);
    this.socketOptions = null;

    if (this.enabled) {
      const redisUrl = new URL(process.env.REDIS_URL);
      this.socketOptions = {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
      };
    }
  }

  async setSessionValue(sessionId, data, ttlSeconds = 3600) {
    if (!this.enabled || !sessionId) {
      return;
    }

    const payload = encodeCommand([
      'SET',
      `session:${sessionId}`,
      JSON.stringify(data),
      'EX',
      String(ttlSeconds),
    ]);

    await this.send(payload);
  }

  async send(payload) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(this.socketOptions, () => {
        socket.write(payload);
      });

      socket.on('data', (buffer) => {
        const response = buffer.toString();
        if (response.startsWith('-')) {
          reject(new Error(`Redis error response: ${response}`));
          socket.end();
          return;
        }

        resolve(response);
        socket.end();
      });

      socket.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = { RedisSessionStore };
