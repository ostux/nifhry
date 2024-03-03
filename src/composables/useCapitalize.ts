export function useCapitalize() {
  const capitalize = (str: string): string => {
    let words: string | string[] = str.trim();

    if (words.length < 3) return words;

    words = words.split(' ');

    words = words.map((word) => {
      if (word.length > 1) {
        return word[0].toUpperCase() + word.substring(1).toLowerCase();
      }
      return word;
    });

    return words.join(' ');
  };

  return {
    capitalize
  };
}
