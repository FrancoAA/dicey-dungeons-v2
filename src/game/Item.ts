export interface ItemEffect {
    type: 'damage' | 'defense' | 'healing' | 'mp' | 'maxHp' | 'maxMp' | 'reroll' | 'diceBonus';
    value: number;
    duration?: number;  // Number of battles this effect lasts, undefined means permanent
}

export interface Item {
    id: string;
    name: string;
    description: string;
    emoji: string;
    cost: number;
    effects: ItemEffect[];
    consumable: boolean;  // If true, item is used up after use
    equipped?: boolean;   // If true, item is currently equipped
}

export const ITEMS: { [key: string]: Item } = {
    HEALTH_POTION: {
        id: 'HEALTH_POTION',
        name: 'Health Potion',
        description: 'Restores 10 HP',
        emoji: '🧪',
        cost: 10,
        effects: [{ type: 'healing', value: 10 }],
        consumable: true
    },
    MAGIC_SCROLL: {
        id: 'MAGIC_SCROLL',
        name: 'Magic Scroll',
        description: 'Restores 5 MP',
        emoji: '📜',
        cost: 15,
        effects: [{ type: 'mp', value: 5 }],
        consumable: true
    },
    SHARP_SWORD: {
        id: 'SHARP_SWORD',
        name: 'Sharp Sword',
        description: 'Attack dice deal +2 damage',
        emoji: '⚔️',
        cost: 100,
        effects: [{ type: 'damage', value: 2 }],
        consumable: false
    },
    STEEL_SHIELD: {
        id: 'STEEL_SHIELD',
        name: 'Steel Shield',
        description: 'Defense dice block +1 damage',
        emoji: '🛡️',
        cost: 80,
        effects: [{ type: 'defense', value: 1 }],
        consumable: false
    },
    MAGIC_RING: {
        id: 'MAGIC_RING',
        name: 'Magic Ring',
        description: 'Increases max MP by 5',
        emoji: '💍',
        cost: 120,
        effects: [{ type: 'maxMp', value: 5 }],
        consumable: false
    },
    LUCKY_CHARM: {
        id: 'LUCKY_CHARM',
        name: 'Lucky Charm',
        description: 'Grants an extra reroll per battle',
        emoji: '🍀',
        cost: 150,
        effects: [{ type: 'reroll', value: 1 }],
        consumable: false
    }
};
