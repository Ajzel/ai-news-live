import { NewsItem } from './types';

type Category = NewsItem['category'];
type Scored = Exclude<Category, 'General'>;

const KEYWORDS: Record<Scored, RegExp[]> = {
  Ethics: [
    /\bethic/i,
    /\bbias(es|ed)?\b/i,
    /\bfairness\b/i,
    /\bsafety\b/i,
    /\balignment\b/i,
    /\bregulat/i,
    /\blegislat/i,
    /\bai act\b/i,
    /\bprivacy\b/i,
    /\bcopyright/i,
    /\bwatermark/i,
    /\bprovenance\b/i,
    /\bgovernance\b/i,
    /\bmisinformation\b/i,
    /\bdeepfake/i,
    /\blawsuit/i,
    /\bresponsible ai\b/i,
    /\bsurveillance\b/i,
    /\bhack(ed|ing|s)?\b/i,
    /\bmisuse\b/i,
    /\bjailbreak/i,
    /\bprompt injection\b/i,
  ],
  Robotics: [
    /\brobot/i,
    /\bhumanoid/i,
    /\bdrones?\b/i,
    /\bembodied\b/i,
    /\bself-driving\b/i,
    /\bautonomous (vehicles?|driving)\b/i,
    /\bmanipulation\b/i,
    /\bquadruped/i,
    /\bactuator/i,
    /\bgrasp/i,
    /\blocomotion\b/i,
  ],
  LLM: [
    /\bllms?\b/i,
    /\blanguage models?\b/i,
    /\bfoundation models?\b/i,
    /\bgpt/i,
    /\bchatgpt\b/i,
    /\bclaude\b/i,
    /\bgemini\b/i,
    /\bgemma\b/i,
    /\bllama\b/i,
    /\bmistral\b/i,
    /\btransformers?\b/i,
    /\bchatbots?\b/i,
    /\bfine-?tun/i,
    /\bprompt(s|ing)?\b/i,
    /\breasoning\b/i,
    /\bagent/i,
    /\bmultimodal\b/i,
    /\bembedding/i,
    /\bretrieval\b/i,
    /\brag\b/i,
    /\bcopilot\b/i,
    /\bgenerative ai\b/i,
  ],
};

// Tie-break order: the first category listed wins a tie.
const PRIORITY: Scored[] = ['Ethics', 'Robotics', 'LLM'];

function score(text: string, patterns: RegExp[]): number {
  let hits = 0;
  for (const pattern of patterns) {
    if (pattern.test(text)) hits++;
  }
  return hits;
}

export function categorize(title: string, summary = ''): Category {
  let best: Category = 'General';
  let bestScore = 0;

  for (const category of PRIORITY) {
    const total = score(title, KEYWORDS[category]) * 3 + score(summary, KEYWORDS[category]);
    if (total > bestScore) {
      best = category;
      bestScore = total;
    }
  }
  return best;
}

export function withCategory<T extends NewsItem>(item: T): T {
  return { ...item, category: categorize(item.title, item.summary) };
}