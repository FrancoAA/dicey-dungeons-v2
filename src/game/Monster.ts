export interface MonsterStats {
    name: string;
    emoji: string;
    hp: number;
    minAttack: number;
    maxAttack: number;
    experienceReward: number;
    goldReward: number;
}

export class Monster {
    private readonly _stats: MonsterStats;
    private _currentHp: number;

    constructor(stats: MonsterStats) {
        this._stats = stats;
        this._currentHp = stats.hp;
    }

    // Getters
    get name(): string { return this._stats.name; }
    get emoji(): string { return this._stats.emoji; }
    get hp(): number { return this._currentHp; }
    get maxHp(): number { return this._stats.hp; }
    get experienceReward(): number { return this._stats.experienceReward; }
    get goldReward(): number { return this._stats.goldReward; }

    // Combat methods
    takeDamage(amount: number): void {
        this._currentHp = Math.max(0, this._currentHp - amount);
    }

    calculateAttack(): number {
        return Math.floor(
            Math.random() * (this._stats.maxAttack - this._stats.minAttack + 1)
            + this._stats.minAttack
        );
    }

    isDead(): boolean {
        return this._currentHp <= 0;
    }
}

// Predefined monsters
export const MonsterTypes: { [key: string]: MonsterStats } = {
    Slime: {
        name: 'Slime',
        emoji: '🟢',
        hp: 6,
        minAttack: 1,
        maxAttack: 2,
        experienceReward: 25,
        goldReward: 10
    },
    Skeleton: {
        name: 'Skeleton',
        emoji: '💀',
        hp: 10,
        minAttack: 1,
        maxAttack: 3,
        experienceReward: 35,
        goldReward: 15
    },
    Ghost: {
        name: 'Ghost',
        emoji: '👻',
        hp: 10,
        minAttack: 2,
        maxAttack: 4,
        experienceReward: 30,
        goldReward: 20
    },
    Dragon: {
        name: 'Dragon',
        emoji: '🐉',
        hp: 30,
        minAttack: 2,
        maxAttack: 6,
        experienceReward: 100,
        goldReward: 50
    }
};

// Boss monsters
export const BossTypes: { [key: string]: MonsterStats } = {
    DragonKing: {
        name: 'Dragon King',
        emoji: '🐲',
        hp: 50,
        minAttack: 6,
        maxAttack: 10,
        experienceReward: 200,
        goldReward: 100
    },
    DungeonLord: {
        name: 'Dungeon Lord',
        emoji: '👑',
        hp: 45,
        minAttack: 5,
        maxAttack: 12,
        experienceReward: 180,
        goldReward: 120
    }
};
