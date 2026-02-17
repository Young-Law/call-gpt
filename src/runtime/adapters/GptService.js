require('colors');
const EventEmitter = require('events');
const { tools, toolHandlers } = require('../../tools/tool-definitions');
const { OpenAiAdapter } = require('./OpenAiAdapter');
const { config } = require('../../config');

class GptService extends EventEmitter {
  constructor({ openAiAdapter = new OpenAiAdapter() } = {}) {
    super();
    this.openAiAdapter = openAiAdapter;
    this.userContext = [
      { role: 'system', content: 'Keep your responses as brief as possible.' },
      { role: 'assistant', content: 'Hello, and thank you for calling E. Orum Young Law; How may i be of service to you today?' },
    ];
    this.partialResponseIndex = 0;
  }

  setCallSid(callSid) { this.userContext.push({ role: 'system', content: `callSid: ${callSid}` }); }
  validateFunctionArgs(args) { try { return JSON.parse(args); } catch { return {}; } }
  updateUserContext(name, role, text) { this.userContext.push(name !== 'user' ? { role, name, content: text } : { role, content: text }); }

  async completion(text, interactionCount, role = 'user', name = 'user') {
    this.updateUserContext(name, role, text);

    const stream = await this.openAiAdapter.createChatCompletion({
      model: config.openai.model,
      messages: this.userContext,
      tools,
      stream: true,
    });

    let completeResponse = '';
    let partialResponse = '';
    let functionName = '';
    let functionArgs = '';
    let finishReason = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      const deltas = chunk.choices[0]?.delta || {};
      finishReason = chunk.choices[0]?.finish_reason;

      if (deltas.tool_calls) {
        functionName = deltas.tool_calls[0]?.function?.name || functionName;
        functionArgs += deltas.tool_calls[0]?.function?.arguments || '';
      }

      if (finishReason === 'tool_calls') {
        const functionToCall = toolHandlers[functionName];
        const validatedArgs = this.validateFunctionArgs(functionArgs);
        const say = tools.find((tool) => tool.function.name === functionName)?.function?.say;
        if (say) this.emit('gptreply', { partialResponseIndex: null, partialResponse: say }, interactionCount);
        const functionResponse = await functionToCall(validatedArgs);
        this.updateUserContext(functionName, 'function', functionResponse);
        await this.completion(functionResponse, interactionCount, 'function', functionName);
      } else {
        completeResponse += content;
        partialResponse += content;
        if (content.trim().slice(-1) === '•' || finishReason === 'stop') {
          this.emit('gptreply', { partialResponseIndex: this.partialResponseIndex, partialResponse }, interactionCount);
          this.partialResponseIndex += 1;
          partialResponse = '';
        }
      }
    }

    this.userContext.push({ role: 'assistant', content: completeResponse });
  }
}

module.exports = { GptService };
