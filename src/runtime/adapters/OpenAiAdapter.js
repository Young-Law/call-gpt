const OpenAI = require('openai');

class OpenAiAdapter {
  constructor(client = new OpenAI()) {
    this.client = client;
  }

  createChatCompletion(payload) {
    return this.client.chat.completions.create(payload);
  }
}

module.exports = { OpenAiAdapter };
