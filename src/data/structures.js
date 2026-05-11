// Italian grammatical structures tracked for the Plateau Breaker.
// Focused on the B1→C1 transition: structures that intermediate learners
// systematically AVOID rather than fail at.
export const TRACKED_STRUCTURES = [
  {
    id: 'congiuntivo_presente',
    label: 'Congiuntivo presente',
    description: 'The present subjunctive — the #1 marker of advanced Italian. Used after credo che, penso che, è importante che, benché.',
    category: 'subjunctive',
    priority: 1,
    examples: [
      'Credo che lui sia stanco.',
      'È importante che tu venga domani.',
      'Benché piova, usciamo lo stesso.',
    ],
    elicitations: [
      "Cosa pensi che faranno i tuoi colleghi questo weekend?",
      "Credi che sia possibile lavorare da casa per sempre?",
      "Cosa è importante che un buon capo sappia fare?",
    ],
  },
  {
    id: 'congiuntivo_imperfetto',
    label: 'Congiuntivo imperfetto',
    description: 'The imperfect subjunctive — used after past tenses (credevo che fosse) and in hypothetical sentences (se fossi ricco).',
    category: 'subjunctive',
    priority: 1,
    examples: [
      'Vorrei che tu fossi qui.',
      'Pensavo che lui sapesse la verità.',
      'Se avessi tempo, viaggerei di più.',
    ],
    elicitations: [
      "Se tu fossi il presidente per un giorno, cosa cambieresti?",
      "Cosa pensavi che sarebbe successo nella tua carriera?",
      "Vorresti che le cose fossero diverse oggi?",
    ],
  },
  {
    id: 'condizionale_presente',
    label: 'Condizionale presente',
    description: 'The present conditional — used for polite requests and hypotheticals (vorrei, mangerei, andrei).',
    category: 'conditional',
    priority: 1,
    examples: [
      'Vorrei un caffè, per favore.',
      'Mangerei volentieri una pizza ora.',
      'Cosa faresti al mio posto?',
    ],
    elicitations: [
      "Se potessi vivere ovunque, dove andresti?",
      "Cosa faresti con un milione di euro?",
      "Quale lavoro sceglieresti se potessi ricominciare?",
    ],
  },
  {
    id: 'periodo_ipotetico',
    label: 'Periodo ipotetico (se + congiuntivo)',
    description: 'Hypothetical sentences with se — the second type combines congiuntivo imperfetto + condizionale (Se fossi ricco, viaggerei).',
    category: 'conditional',
    priority: 1,
    examples: [
      'Se avessi più tempo, imparerei il piano.',
      'Se non piovesse, andremmo al mare.',
      'Se fossi al tuo posto, accetterei subito.',
    ],
    elicitations: [
      "Se domani non dovessi lavorare, cosa faresti?",
      "Se tu vivessi in un altro paese, quale sceglieresti e perché?",
      "Se potessi cambiare una decisione del passato, quale cambieresti?",
    ],
  },
  {
    id: 'ne_ci',
    label: 'Ne / ci pronominali',
    description: 'The particles ne (about it/of it/some) and ci (there/about it). Native-speed Italian uses these constantly.',
    category: 'pronouns',
    priority: 1,
    examples: [
      'Ne ho parlato con Marco.',
      'Quanti caffè bevi al giorno? Ne bevo tre.',
      'Ci penso io.',
      'A Roma? Ci sono andato l\'anno scorso.',
    ],
    elicitations: [
      "Quanti libri leggi al mese?",
      "Hai mai pensato di trasferirti all'estero?",
      "Sei mai stato in Sicilia?",
    ],
  },
  {
    id: 'clitici_doppi',
    label: 'Clitici doppi (me lo, gliene, ce ne)',
    description: 'Combined clitic pronouns. A clear B2/C1 marker (te lo dico, gliene parlo, me ne vado).',
    category: 'pronouns',
    priority: 2,
    examples: [
      'Te lo dico domani.',
      'Gliene ho parlato ieri.',
      'Me ne vado adesso.',
      'Ce l\'ho fatta!',
    ],
    elicitations: [
      "Quando hai dato la notizia ai tuoi genitori, come hai gliel'hai detta?",
      "Hai già parlato con il tuo capo del nuovo progetto?",
      "Hai voglia di restare o pensi di andartene presto?",
    ],
  },
  {
    id: 'connettori_avanzati',
    label: 'Connettori avanzati',
    description: 'Advanced connectors: nonostante, sebbene, qualora, anziché, tuttavia, ammesso che. Mark sophisticated discourse.',
    category: 'discourse',
    priority: 1,
    examples: [
      'Nonostante fosse stanco, ha continuato.',
      'Sebbene piova, andiamo lo stesso.',
      'Tuttavia, devo riconoscere che ha ragione.',
      'Anziché lamentarti, fai qualcosa.',
    ],
    elicitations: [
      "Hai mai continuato a fare qualcosa anche se sapevi che era difficile? Raccontami.",
      "Quali sono i pro e i contro del lavoro in remoto?",
      "Cosa pensi delle persone che si lamentano sempre invece di agire?",
    ],
  },
  {
    id: 'condizionale_passato',
    label: 'Condizionale passato',
    description: 'Past conditional — for things that would have happened (avrei voluto, sarebbe venuto). Also for "future-in-the-past": ha detto che sarebbe venuto.',
    category: 'conditional',
    priority: 2,
    examples: [
      'Avrei voluto venire, ma non potevo.',
      'Sarei stato più felice se fossi rimasto.',
      'Mi aveva detto che sarebbe arrivato presto.',
    ],
    elicitations: [
      "C'è qualcosa che avresti fatto diversamente nella tua vita?",
      "Cosa ti aveva promesso qualcuno che poi non si è realizzato?",
      "Saresti diventato un'altra persona se avessi vissuto altrove?",
    ],
  },
  {
    id: 'gerundio',
    label: 'Gerundio (stare facendo, pur essendo)',
    description: 'The gerund — for ongoing actions (sto mangiando), causal/concessive (essendo stanco, pur essendo giovane).',
    category: 'tense',
    priority: 2,
    examples: [
      'Sto leggendo un libro.',
      'Essendo arrivato in ritardo, ha perso la riunione.',
      'Pur essendo giovane, è molto maturo.',
    ],
    elicitations: [
      "Cosa stavi facendo ieri sera alle otto?",
      "Hai imparato qualcosa importante facendo errori?",
      "Cosa sta succedendo nella tua vita in questo momento?",
    ],
  },
  {
    id: 'imperativo',
    label: 'Imperativo (formale e negativo)',
    description: 'Imperative forms — informal (vai!), formal Lei (vada!), and negative (non andare! non andate!).',
    category: 'mood',
    priority: 3,
    examples: [
      'Vai a casa!',
      'Non preoccuparti!',
      'Mi dica, signore.',
      'Fammi un favore.',
    ],
    elicitations: [
      "Quale consiglio daresti a qualcuno che inizia a imparare l'italiano?",
      "Cosa NON dovrei mai dire a un italiano per non offenderlo?",
      "Dimmi tre cose che dovrei assolutamente fare in Italia.",
    ],
  },
]

export const STRUCTURE_BY_ID = Object.fromEntries(
  TRACKED_STRUCTURES.map(s => [s.id, s])
)

// Pick today's mission: prioritize structures the user uses LEAST
// (the avoidance grammar pattern)
export function pickDailyMission(structureUsage = {}, history = []) {
  // Get all-time usage counts per structure
  const totals = {}
  for (const date of Object.keys(structureUsage)) {
    for (const [sid, count] of Object.entries(structureUsage[date] || {})) {
      totals[sid] = (totals[sid] || 0) + count
    }
  }

  // Skip structures the user has been assigned recently (last 5 missions)
  const recentMissions = history.slice(-5).map(m => m.structureId)

  // Score each structure: lower usage + higher priority = better candidate
  const candidates = TRACKED_STRUCTURES
    .filter(s => !recentMissions.includes(s.id))
    .map(s => ({
      structure: s,
      usage: totals[s.id] || 0,
      priorityBonus: 4 - s.priority, // priority 1 = bonus 3, priority 3 = bonus 1
    }))
    .sort((a, b) => {
      // Lower usage first, then higher priority
      if (a.usage !== b.usage) return a.usage - b.usage
      return b.priorityBonus - a.priorityBonus
    })

  // Pick from top 3 (a bit of variety)
  const top = candidates.slice(0, 3)
  if (top.length === 0) return TRACKED_STRUCTURES[0]
  return top[Math.floor(Math.random() * top.length)].structure
}
