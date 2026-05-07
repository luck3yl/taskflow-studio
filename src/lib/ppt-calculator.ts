export const parsePageInput = (input: string, maxPages: number): number[] => {
  const pages = new Set<number>();
  const parts = input.split(/[,，]/);
  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes('-')) {
      const [start, end] = p.split('-');
      const s = parseInt(start);
      const e = parseInt(end);
      if (!isNaN(s) && !isNaN(e) && s <= e) {
        for (let i = s; i <= e; i++) {
          if (i >= 1 && (maxPages === 0 || i <= maxPages)) pages.add(i);
        }
      }
    } else {
      const n = parseInt(p);
      if (!isNaN(n) && n >= 1 && (maxPages === 0 || n <= maxPages)) pages.add(n);
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
};

export const formatPageSelection = (pages: number[]): string => {
  if (pages.length === 0) return "";

  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }

  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
};

export const togglePageSelection = (input: string, page: number, maxPages: number): string => {
  const pages = new Set(parsePageInput(input, maxPages));

  if (pages.has(page)) {
    pages.delete(page);
  } else {
    pages.add(page);
  }

  return formatPageSelection(Array.from(pages));
};

export const togglePageGroupSelection = (input: string, targetPages: number[], maxPages: number): string => {
  const pages = new Set(parsePageInput(input, maxPages));
  const normalizedTargets = targetPages.filter(page => page >= 1 && page <= maxPages);
  const isFullySelected = normalizedTargets.every(page => pages.has(page));

  normalizedTargets.forEach(page => {
    if (isFullySelected) {
      pages.delete(page);
    } else {
      pages.add(page);
    }
  });

  return formatPageSelection(Array.from(pages));
};
