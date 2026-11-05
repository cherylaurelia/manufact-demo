const aliases = new Map([
  ["postgresql", "postgres"],
  ["pg", "postgres"],
]);

const stopWords = new Set(
  "a an and any best can connect could for good i in is me mcp mcps my of on or server servers should that the to use what which with".split(" "),
);

export const queryWords = (query: string): string[] =>
  query
    .toLowerCase()
    .split(/[^a-z0-9.+#-]+/)
    .filter((word) => word.length > 1 && !stopWords.has(word))
    .map((word) => aliases.get(word) ?? word);

/** Lowercases text and splits camelCase and snake_case, so "listEmails" reads as "list emails". */
export const searchableText = (text: string): string =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();

/** True when a word in the text starts with the keyword: "email" finds "emails", "ads" doesn't find "threads". */
export const hasWord = (text: string, word: string): boolean => {
  const at = text.indexOf(word);

  if (at < 0) return false;

  if (at === 0 || !/[a-z0-9]/.test(text.charAt(at - 1))) return true;

  return hasWord(text.slice(at + 1), word);
};
