export const levels = [
  { level: 1, name: 'Principiante', nameEn: 'Beginner', xpRequired: 0 },
  { level: 2, name: 'Studente', nameEn: 'Student', xpRequired: 100 },
  { level: 3, name: 'Esploratore', nameEn: 'Explorer', xpRequired: 300 },
  { level: 4, name: 'Viaggiatore', nameEn: 'Traveler', xpRequired: 600 },
  { level: 5, name: 'Conversatore', nameEn: 'Conversationalist', xpRequired: 1000 },
  { level: 6, name: 'Narratore', nameEn: 'Storyteller', xpRequired: 1500 },
  { level: 7, name: 'Comunicatore', nameEn: 'Communicator', xpRequired: 2200 },
  { level: 8, name: 'Interprete', nameEn: 'Interpreter', xpRequired: 3000 },
  { level: 9, name: 'Oratore', nameEn: 'Orator', xpRequired: 4000 },
  { level: 10, name: 'Diplomatico', nameEn: 'Diplomat', xpRequired: 5200 },
  { level: 11, name: 'Poeta', nameEn: 'Poet', xpRequired: 6500 },
  { level: 12, name: 'Filosofo', nameEn: 'Philosopher', xpRequired: 8000 },
  { level: 13, name: 'Scrittore', nameEn: 'Writer', xpRequired: 10000 },
  { level: 14, name: 'Professore', nameEn: 'Professor', xpRequired: 12500 },
  { level: 15, name: 'Accademico', nameEn: 'Academic', xpRequired: 15500 },
  { level: 16, name: 'Ambasciatore', nameEn: 'Ambassador', xpRequired: 19000 },
  { level: 17, name: 'Virtuoso', nameEn: 'Virtuoso', xpRequired: 23000 },
  { level: 18, name: 'Maestro', nameEn: 'Master', xpRequired: 28000 },
  { level: 19, name: 'Gran Maestro', nameEn: 'Grand Master', xpRequired: 35000 },
  { level: 20, name: 'Leggenda', nameEn: 'Legend', xpRequired: 45000 },
]

export function getLevelForXP(xp) {
  let currentLevel = levels[0]
  for (const level of levels) {
    if (xp >= level.xpRequired) {
      currentLevel = level
    } else {
      break
    }
  }
  return currentLevel
}

export function getXPProgress(xp) {
  const current = getLevelForXP(xp)
  const currentIdx = levels.findIndex((l) => l.level === current.level)
  const next = levels[currentIdx + 1]

  if (!next) {
    return { current, next: null, progress: 1, xpInLevel: 0, xpNeeded: 0 }
  }

  const xpInLevel = xp - current.xpRequired
  const xpNeeded = next.xpRequired - current.xpRequired
  const progress = xpInLevel / xpNeeded

  return { current, next, progress, xpInLevel, xpNeeded }
}
