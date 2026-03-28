import { runNeuralSchema } from './services/ai/neuralSchema.js';
import { extractNLPFeatures } from './services/ai/nlpEngine.js';

const texts = [
  'Hi mom, I am running late for dinner!',
  'This is the IRS. You owe taxes. Pay in gift cards or face arrest.',
  'i need u to buy a $100 steam gift card and send me the code. its an emergency.'
];

texts.forEach(text => {
  const nlp = extractNLPFeatures(text);
  const result = runNeuralSchema(nlp, null);
  console.log('--- TEXT ---');
  console.log(text);
  console.log('Score:', result.risk_score, result.risk_level);
  console.log('Indicators:', result.detected_indicators);
  console.log('Explanation:', result.explanation);
});
