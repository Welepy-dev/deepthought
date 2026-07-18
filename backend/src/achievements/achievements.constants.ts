
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
    description: 'Concluding your first project',
    icon: '⚔️',
    xpReward: 100,
    check: (s) => s.completedProjects >= 1,
  },
  {
    slug: 'TEN_PROJECTS',
    title: 'Ten Projects',
    description: 'Concluding 10 projects',
    icon: '🔟',
    xpReward: 500,
    check: (s) => s.completedProjects >= 10,
  },
  {
    slug: 'TWENTY_PROJECTS',
    title: 'Twenty Projects',
    description: 'Concluding 20 projects',
    icon: '🏆',
    xpReward: 1000,
    check: (s) => s.completedProjects >= 20,
  },

  // ─── NÍVEIS ────────────────────────────────────────
  {
    slug: 'LEVEL_5',
    title: 'Level 5',
    description: 'Reach level 5 on 42',
    icon: '⭐',
    xpReward: 200,
    check: (s) => s.level >= 5,
  },
  {
    slug: 'LEVEL_10',
    title: 'Level 10',
    description: 'Reach level 10 on 42',
    icon: '🌟',
    xpReward: 500,
    check: (s) => s.level >= 10,
  },
  {
    slug: 'LEVEL_20',
    title: 'Mestre da 42',
    description: 'Reach level 20 on 42',
    icon: '💫',
    xpReward: 2000,
    check: (s) => s.level >= 20,
  },

  // ─── AVALIAÇÕES ─────────────────────────────────────
  {
    slug: 'EVALUATOR',
    title: 'Evaluator',
    description: 'Accumulate 50 evaluation points',
    icon: '📋',
    xpReward: 300,
    check: (s) => s.evalPoints >= 50,
  },

  // ─── AJUDA ──────────────────────────────────────────
  {
    slug: 'HELPER',
    title: 'Good Samaritan',
    description: 'Help 10 students',
    icon: '🤝',
    xpReward: 250,
    check: (s) => s.helpOffersGiven >= 10,
  },
  {
    slug: 'MASTER_HELPER',
    title: 'Master of Help',
    description: 'Help 50 students',
    icon: '🦸',
    xpReward: 1000,
    check: (s) => s.helpOffersGiven >= 50,
  },
];