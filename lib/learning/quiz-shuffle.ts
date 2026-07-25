export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

/**
 * Small deterministic PRNG used only for display ordering. Keeping the state
 * unsigned is important: JavaScript's `%` keeps a negative sign and the old
 * implementation could therefore produce negative Fisher-Yates indexes.
 */
export function createSeededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619) >>> 0;
  }

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

/**
 * Shuffle both questions and answer options while retaining the correct answer
 * mapping. A supplied attempt seed keeps the order stable across React renders.
 */
export function shuffleQuizQuestions(
  questions: readonly QuizQuestion[],
  attemptSeed: string
): QuizQuestion[] {
  const random = createSeededRandom(attemptSeed);

  const withShuffledOptions = questions.map((question) => {
    const options = question.options.map((text, originalIndex) => ({ text, originalIndex }));
    const shuffledOptions = seededShuffle(options, random);
    const correctIndex = shuffledOptions.findIndex(
      (option) => option.originalIndex === question.correctIndex
    );

    if (correctIndex < 0) {
      throw new Error(`Quiz question ${question.id} has an invalid correct answer.`);
    }

    return {
      ...question,
      options: shuffledOptions.map((option) => option.text),
      correctIndex,
    };
  });

  return seededShuffle(withShuffledOptions, random);
}
