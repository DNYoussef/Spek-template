/**
 * AI Model Definitions
 * Centralized model type constants
 */

const AIModel = {
  GPT5: 'gpt-5',
  GPT5_MINI: 'gpt-5-mini',
  GPT5_NANO: 'gpt-5-nano',
  O3: 'o3',
  O3_MINI: 'o3-mini',
  GEMINI_PRO: 'gemini-2.5-pro',
  GEMINI_FLASH: 'gemini-2.5-flash',
  CLAUDE_OPUS: 'claude-opus-4.1',
  CLAUDE_SONNET: 'claude-sonnet-4'
};

const ReasoningComplexity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

module.exports = {
  AIModel,
  ReasoningComplexity
};