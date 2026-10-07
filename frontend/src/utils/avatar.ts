// Telegram-like deterministic avatar colours: the same name always gets the same gradient.
const GRADIENTS = [
  'from-rose-500 to-orange-400',
  'from-amber-500 to-yellow-400',
  'from-emerald-500 to-lime-400',
  'from-sky-500 to-cyan-400',
  'from-indigo-500 to-blue-400',
  'from-fuchsia-500 to-pink-400',
  'from-violet-500 to-purple-400',
  'from-teal-500 to-emerald-400',
];

export const avatarGradient = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
};

export const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};
