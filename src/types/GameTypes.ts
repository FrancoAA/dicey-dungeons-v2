export enum DiceType {
    ATTACK = '⚔️',
    DEFENSE = '🛡️',
    MAGIC = '✨',
    HEALTH = '💝'
}

export enum RoomType {
    MONSTER = 'monster',
    CHEST = 'chest',
    MERCHANT = 'merchant',
    BOSS = 'boss'
}

export interface PlayerStats {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    level: number;
    experience: number;
}

export interface DiceResult {
    type: DiceType;
    value: number;
    locked: boolean;
}

export interface Equipment {
    name: string;
    slot: 'weapon' | 'armor' | 'accessory';
    effect: string;
}
