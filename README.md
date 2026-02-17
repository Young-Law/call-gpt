# call-gpt

## Runtime architecture

The call runtime, tool definitions, and third-party integrations are now fully composed from `src/`.

- Runtime orchestration: `src/runtime/core`
- Runtime adapters (OpenAI, Deepgram, Twilio, stream): `src/runtime/adapters`
- Tool metadata + handlers: `src/tools`
- Zoho integration boundary: `src/integrations/zoho`
- Configuration access: `src/config`

## Checks

- `npm test` runs fast syntax guard checks
- `npm run lint` runs ESLint
- `npm run test:modern` runs modern Jest suites
