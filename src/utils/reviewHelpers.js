// Distractor generators by category
const CATEGORY_DISTRACTORS = {
  gender_agreement: (item) => {
    const correct = item.corrected
    const original = item.original
    // Generate gender-swapped variants
    const variants = []
    // Swap articles: il↔la, un↔una, lo↔la, i↔le, gli↔le
    const swaps = [
      [/\bil\b/g, 'la'], [/\bla\b/g, 'il'],
      [/\bun\b/g, 'una'], [/\buna\b/g, 'un'],
      [/\blo\b/g, 'la'], [/\bi\b/g, 'le'],
      [/\bgli\b/g, 'le'], [/\ble\b/g, 'i'],
      [/\bmio\b/g, 'mia'], [/\bmia\b/g, 'mio'],
      [/\btuo\b/g, 'tua'], [/\btua\b/g, 'tuo'],
      [/\bsuo\b/g, 'sua'], [/\bsua\b/g, 'suo'],
      [/\bbello\b/g, 'bella'], [/\bbella\b/g, 'bello'],
      [/\bbuono\b/g, 'buona'], [/\bbuona\b/g, 'buono'],
    ]
    for (const [pattern, replacement] of swaps) {
      const swapped = correct.replace(pattern, replacement)
      if (swapped !== correct && swapped !== original) variants.push(swapped)
    }
    // Always include original mistake
    if (!variants.includes(original)) variants.unshift(original)
    return variants
  },

  articles: (item) => {
    const correct = item.corrected
    const original = item.original
    const articles = ['il', 'lo', 'la', "l'", 'i', 'gli', 'le', 'un', 'uno', 'una', "un'"]
    const variants = [original]
    for (const art of articles) {
      const swapped = correct.replace(/^(il|lo|la|l'|i|gli|le|un|uno|una|un')\b/i, art)
      if (swapped !== correct && swapped !== original && !variants.includes(swapped)) {
        variants.push(swapped)
      }
    }
    return variants
  },

  prepositions: (item) => {
    const correct = item.corrected
    const original = item.original
    const preps = ['di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
      'del', 'al', 'dal', 'nel', 'sul', 'dello', 'alla', 'dalla', 'nella', 'sulla']
    const variants = [original]
    for (const prep of preps) {
      const swapped = correct.replace(/\b(di|a|da|in|con|su|per|tra|fra|del|al|dal|nel|sul|dello|alla|dalla|nella|sulla)\b/i, prep)
      if (swapped !== correct && swapped !== original && !variants.includes(swapped)) {
        variants.push(swapped)
      }
    }
    return variants
  },

  verb_conjugation: (item) => {
    const original = item.original
    const correct = item.corrected
    // Common verb ending mutations
    const endings = [
      [/o$/, 'i'], [/o$/, 'a'], [/o$/, 'e'],
      [/i$/, 'o'], [/i$/, 'e'], [/i$/, 'a'],
      [/a$/, 'o'], [/a$/, 'e'],
      [/ato$/, 'uto'], [/ato$/, 'ito'],
      [/uto$/, 'ato'], [/uto$/, 'ito'],
      [/ito$/, 'ato'], [/ito$/, 'uto'],
    ]
    const variants = [original]
    for (const [pattern, replacement] of endings) {
      const words = correct.split(' ')
      for (let wi = 0; wi < words.length; wi++) {
        if (pattern.test(words[wi])) {
          const newWords = [...words]
          newWords[wi] = words[wi].replace(pattern, replacement)
          const swapped = newWords.join(' ')
          if (swapped !== correct && swapped !== original && !variants.includes(swapped)) {
            variants.push(swapped)
          }
        }
      }
    }
    return variants
  },
}

// Generic distractor: slight modifications of the correct answer
function genericDistractors(item) {
  const correct = item.corrected
  const original = item.original
  const variants = [original]

  // Swap a random word order
  const words = correct.split(' ')
  if (words.length >= 3) {
    const swapped = [...words]
    const i = Math.floor(words.length / 2)
    ;[swapped[i], swapped[i - 1]] = [swapped[i - 1], swapped[i]]
    const v = swapped.join(' ')
    if (v !== correct && !variants.includes(v)) variants.push(v)
  }

  // Remove a word
  if (words.length >= 2) {
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      const v = words.filter((_, j) => j !== i).join(' ')
      if (v !== correct && !variants.includes(v)) variants.push(v)
    }
  }

  return variants
}

export function shuffleArray(arr) {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function generateDistractors(item) {
  const categoryFn = CATEGORY_DISTRACTORS[item.category]
  let distractors = categoryFn ? categoryFn(item) : []

  // Add generic distractors if we don't have enough
  if (distractors.length < 3) {
    const generic = genericDistractors(item)
    for (const g of generic) {
      if (!distractors.includes(g) && g !== item.corrected) {
        distractors.push(g)
      }
    }
  }

  // Filter out the correct answer and duplicates
  distractors = distractors
    .filter((d) => d !== item.corrected)
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .slice(0, 3)

  // If still not enough, create slight typo variants
  while (distractors.length < 3) {
    const words = item.corrected.split(' ')
    if (words.length > 1) {
      const idx = Math.floor(Math.random() * words.length)
      const modified = [...words]
      modified[idx] = modified[idx] + (modified[idx].endsWith('a') ? 'e' : 'a')
      const v = modified.join(' ')
      if (!distractors.includes(v) && v !== item.corrected) {
        distractors.push(v)
      } else {
        // Last resort: just add the original
        if (!distractors.includes(item.original)) {
          distractors.push(item.original)
        }
        break
      }
    } else {
      break
    }
  }

  return distractors.slice(0, 3)
}

export function buildReviewCard(item) {
  const distractors = generateDistractors(item)
  const options = shuffleArray([item.corrected, ...distractors])
  const correctIndex = options.indexOf(item.corrected)

  // Build contextual sentence — highlight the mistake part
  const sentence = item.sentenceContext || `...${item.original}...`
  const highlightedSentence = sentence.replace(
    item.original,
    `[${item.original}]`
  )

  // Generate hint from explanation
  const hint = item.explanation || `Category: ${item.category?.replace('_', ' ')}`

  return {
    sentence: highlightedSentence,
    originalSentence: sentence,
    mistake: item.original,
    correct: item.corrected,
    hint,
    category: item.category,
    explanation: item.explanation,
    options,
    correctIndex,
  }
}
