import type { Preset, Theme } from './types';

export const presets: Record<Theme, Preset> = {
  space: { theme:'space', bpm:90, volumes:{melody:75,bass:45,rain:0,wind:24,bells:55}, label:'星際漫遊',description:'發光星雲、合成器與水晶聲' },
  ocean: { theme:'ocean', bpm:76, volumes:{melody:52,bass:28,rain:35,wind:62,bells:27}, label:'深海夢境',description:'藍色波浪、柔和旋律與環境聲' },
  forest: { theme:'forest', bpm:104, volumes:{melody:50,bass:28,rain:55,wind:34,bells:64}, label:'魔法森林',description:'森林綠光、雨滴與清脆音符' },
  city: { theme:'city', bpm:126, volumes:{melody:82,bass:75,rain:18,wind:8,bells:48}, label:'霓虹城市',description:'霓虹節奏、低音與電子旋律' },
};

const has = (text:string, words:string[]) => words.some(word=>text.includes(word));

/** Local keyword interpretation. This does not send prompts to any AI service. */
export function parsePrompt(text: string): Preset {
  const x = text.toLowerCase();
  let theme: Theme = 'space';
  if (has(x, ['海洋','海底','海浪','潛水','大海','ocean','sea','water'])) theme='ocean';
  else if (has(x,['森林','樹林','鳥','雨林','草地','forest','jungle'])) theme='forest';
  else if (has(x,['城市','街道','霓虹','都市','賽博','city','neon','street'])) theme='city';
  else if (has(x,['太空','宇宙','星空','星球','銀河','星際','space','galaxy','cosmic'])) theme='space';
  const p: Preset = structuredClone(presets[theme]);
  const explicit = x.match(/(?:速度|節奏|bpm)?\s*[:：]?\s*(\d{2,3})\s*bpm/i);
  if (explicit) p.bpm = Math.max(50,Math.min(170,Number(explicit[1])));
  else if (has(x,['快速','熱鬧','強烈','快節奏','跳舞','動感','快一點','fast','dance'])) p.bpm=132;
  else if (has(x,['緩慢','平靜','慢','舒眠','冥想','安靜','放鬆','slow','calm','relax'])) p.bpm=68;
  if (has(x,['下雨','雨聲','雨滴','暴雨','rain'])) p.volumes.rain=80;
  if (has(x,['強風','風聲','海風','wind','breeze'])) p.volumes.wind=72;
  if (has(x,['鈴聲','鐘聲','清脆','魔法','bells','chime'])) p.volumes.bells=84;
  if (has(x,['低音','重拍','鼓聲','bass','beat'])) p.volumes.bass=82;
  if (has(x,['旋律','鋼琴','melody','piano'])) p.volumes.melody=85;
  if (has(x,['不要雨','沒有雨','無雨','no rain'])) p.volumes.rain=0;
  p.description = text.trim() || p.description;
  return p;
}
