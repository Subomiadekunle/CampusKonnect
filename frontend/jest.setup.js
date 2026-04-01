// Prevent Expo's winter runtime lazy getters from firing inside Jest's module scope
global.__ExpoImportMetaRegistry = {};

// Pre-define globals that expo/src/winter/installGlobal.ts would lazily load,
// so its lazy getters never attempt a require() inside Jest's runtime checker.
const { TextEncoder, TextDecoder } = require('util');
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
if (!global.structuredClone) {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}
