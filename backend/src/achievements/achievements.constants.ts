
export interface AchievementDefinition {
  slug: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  check: (stats: UserStats) => boolean;
}


export interface UserStats {
  completedProjects: number;
  level: number;
  evalPoints: number;
  helpOffersGiven: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ─── PROJECTOS ────────────────────────────────────────
  {
    slug: 'FIRST_PROJECT',
    title: 'First Blood',
    description: 'Concluir o primeiro projecto na 42',
    icon: '⚔️',
    xpReward: 100,
    check: (s) => s.completedProjects >= 1,
  },
  {
    slug: 'TEN_PROJECTS',
    title: 'Dez Projectos',
    description: 'Concluir 10 projectos',
    icon: '🔟',
    xpReward: 500,
    check: (s) => s.completedProjects >= 10,
  },
  {
    slug: 'TWENTY_PROJECTS',
    title: 'Vinte Projectos',
    description: 'Concluir 20 projectos',
    icon: '🏆',
    xpReward: 1000,
    check: (s) => s.completedProjects >= 20,
  },

  // ─── NÍVEIS ────────────────────────────────────────
  {
    slug: 'LEVEL_5',
    title: 'Nível 5',
    description: 'Alcançar o nível 5 na 42',
    icon: '⭐',
    xpReward: 200,
    check: (s) => s.level >= 5,
  },
  {
    slug: 'LEVEL_10',
    title: 'Nível 10',
    description: 'Alcançar o nível 10 na 42',
    icon: '🌟',
    xpReward: 500,
    check: (s) => s.level >= 10,
  },
  {
    slug: 'LEVEL_20',
    title: 'Mestre da 42',
    description: 'Alcançar o nível 20 na 42',
    icon: '💫',
    xpReward: 2000,
    check: (s) => s.level >= 20,
  },

  // ─── AVALIAÇÕES ─────────────────────────────────────
  {
    slug: 'EVALUATOR',
    title: 'Avaliador',
    description: 'Acumular 50 pontos de avaliação',
    icon: '📋',
    xpReward: 300,
    check: (s) => s.evalPoints >= 50,
  },

  // ─── AJUDA ──────────────────────────────────────────
  {
    slug: 'HELPER',
    title: 'Bom Samaritano',
    description: 'Ajudar 10 estudantes',
    icon: '🤝',
    xpReward: 250,
    check: (s) => s.helpOffersGiven >= 10,
  },
  {
    slug: 'MASTER_HELPER',
    title: 'Mestre da Ajuda',
    description: 'Ajudar 50 estudantes',
    icon: '🦸',
    xpReward: 1000,
    check: (s) => s.helpOffersGiven >= 50,
  },
];