import { NewsItem } from './types';

type Category = NewsItem['category'];

// Checked in order; the first match wins. Anything unmatched stays "General".
const RULES: { category: Category; pattern: RegExp }[] = [
  {
    category: 'Ethics',
    pattern:
      /\b(ethic|bias|fairness|safety|alignment|regulat|policy|privacy|copyright|watermark|provenance|governance|misinformation|deepfake|lawsuit|responsible ai|surveillance)/i,
  },
  {
    category: 'Robotics',
    pattern:
      /\b(robot|humanoid|drone|embodied|self-driving|autonomous vehicle|manipulation|quadruped|actuator)/i,
  },
  {
    category: 'LLM',
    pattern:
      /\b(llm|language model|gpt|claude|gemini|llama|mistral|transformer|chatbot|fine-tun|prompt|reasoning|agentic|agent|diffusion|multimodal|token|rag)\b|\b(retrieval)/i,
  },
];

export function categorize(title: string, summary = ''): Category {
  // Try the title alone first (more precise), then title plus summary.
  for (const text of [title, `${title} ${summary}`]) {
    for (const rule of RULES) {
      if (rule.pattern.test(text)) return rule.category;
    }
  }
  return 'General';
}

export function withCategory<T extends NewsItem>(item: T): T {
  return { ...item, category: categorize(item.title, item.summary) };
}