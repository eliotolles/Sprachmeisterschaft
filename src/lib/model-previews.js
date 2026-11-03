// Pre-key suggestions from Elio and official docs, reviewed 2026-11-03.
// These are NOT an authenticated catalog or a promise of free quota.
const CANDIDATES={
 gemini:['gemini-flash-latest','gemini-flash-lite-latest','gemini-3.8-flash','gemini-3.5-flash-lite'],
 groq:['openai/gpt-oss-20b','openai/gpt-oss-120b','qwen/qwen3.8-27b'],
 openrouter:['openrouter/free','google/gemma-4-31b-it:free','nvidia/nemotron-3.5-super-vl:free','nvidia/nemotron-3-super-120b-a12b:free'],
 openai:['gpt-6.1-sol','gpt-6-astra','gpt-6-luna'],
 anthropic:['claude-sonnet-5-5','claude-haiku-5-5','claude-opus-5-5'],
 deepseek:['deepseek-flash','deepseek-v4-pro'],
 mistral:['mistral-small-latest','mistral-large-latest'],
 cerebras:['qwen-3.8-27b','gpt-oss-120b'],
 together:['Prism-ML/Ternary-Bonsai-27B','Qwen/Qwen3.6-Plus','deepseek-ai/DeepSeek-V4.1-Flash-1017']
};
export const PREVIEW_SOURCES=Object.freeze({
 gemini:'https://ai.google.dev/gemini-api/docs/models',
 groq:'https://console.groq.com/docs/models',
 openrouter:'https://openrouter.ai/docs/guides/routing/routers/free-router',
 openai:'https://developers.openai.com/api/docs/models',
 anthropic:'https://platform.claude.com/docs/en/models/overview',
 deepseek:'https://api-docs.deepseek.com/quick_start/pricing/',
 mistral:'https://docs.mistral.ai/getting-started/quickstarts/studio/test-model-playground',
 cerebras:'https://inference-docs.cerebras.ai/models/overview',
 together:'https://docs.together.ai/docs/serverless/models'
});
export function previewModelSuggestions(provider){
 return (CANDIDATES[provider]||[]).map(id=>({
  id,rawId:id,name:id,provider,preview:true,verified:false,
  reviewedAt:'2026-11-03',source:PREVIEW_SOURCES[provider],
  desc:'Gợi ý đã tra tài liệu · chưa kiểm tra bằng key. Nhập key và bấm Khám phá Model (Live) để xác minh.',
  contextWindow:'Chưa xác minh context',capabilities:{text:true},
  pricing:{isFree:false,tier:['openai','anthropic','deepseek'].includes(provider)?'PAID':'UNKNOWN',note:'Giá/quota và quyền truy cập cần kiểm tra bằng key.'}
 }));
}
