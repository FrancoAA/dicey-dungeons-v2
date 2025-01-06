export interface ItemEffect {
    type: string;
    value: number;
}

export interface Item {
    id: string;
    name: string;
    description: string;
    emoji: string;
    cost: number;
    effects: ItemEffect[];
    consumable: boolean;
    equipped?: boolean;   // If true, item is currently equipped
}

export const ITEMS: { [key: string]: Item } = {
    HEALTH_POTION: {
        id: 'HEALTH_POTION',
        name: 'Health Potion',
        description: 'Restores 5 HP',
        emoji: '🧪',
        cost: 10,
        effects: [{ type: 'healing', value: 7 }],
        consumable: true
    },
    MEDIUM_HEALTH_POTION: {
        id: 'MEDIUM_HEALTH_POTION',
        name: 'Medium Health Potion',
        description: 'Restores 10 HP',
        emoji: '🧪',
        cost: 20,
        effects: [{ type: 'healing', value: 10 }],
        consumable: true
    },
    LARGE_HEALTH_POTION: {
        id: 'LARGE_HEALTH_POTION',
        name: 'Large Health Potion',
        description: 'Restores 20 HP',
        emoji: '🧪',
        cost: 35,
        effects: [{ type: 'healing', value: 20 }],
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
    GREATER_MAGIC_SCROLL: {
        id: 'GREATER_MAGIC_SCROLL',
        name: 'Greater Magic Scroll',
        description: 'Restores 6 MP',
        emoji: '📜',
        cost: 30,
        effects: [{ type: 'mp', value: 9 }],
        consumable: true
    },
    SHARP_SWORD: {
        id: 'SHARP_SWORD',
        name: 'Sharp Sword',
        description: 'Attack dice deal +1 damage',
        emoji: '⚔️',
        cost: 75,
        effects: [{ type: 'damage', value: 1 }],
        consumable: false
    },
    STEEL_SWORD: {
        id: 'STEEL_SWORD',
        name: 'Steel Sword',
        description: 'Attack dice deal +2 damage',
        emoji: '⚔️',
        cost: 120,
        effects: [{ type: 'damage', value: 2 }],
        consumable: false
    },
    MYTHRIL_SWORD: {
        id: 'MYTHRIL_SWORD',
        name: 'Mythril Sword',
        description: 'Attack dice deal +3 damage',
        emoji: '⚔️',
        cost: 200,
        effects: [{ type: 'damage', value: 4 }],
        consumable: false
    },
    STEEL_SHIELD: {
        id: 'STEEL_SHIELD',
        name: 'Steel Shield',
        description: 'Defense dice block +1 damage',
        emoji: '🛡️',
        cost: 100,
        effects: [{ type: 'defense', value: 1 }],
        consumable: false
    },
    MAGIC_RING: {
        id: 'MAGIC_RING',
        name: 'Magic Ring',
        description: 'Increases max MP by 1',
        emoji: '💍',
        cost: 30,
        effects: [{ type: 'maxMp', value: 1 }],
        consumable: false
    },
    ARCHMAGE_RING: {
        id: 'ARCHMAGE_RING',
        name: 'Archmage Ring',
        description: 'Increases max MP by 2',
        emoji: '💍',
        cost: 50,
        effects: [{ type: 'maxMp', value: 2 }],
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
    },
    HEALING_NECKLACE: {
        id: 'HEALING_NECKLACE',
        name: 'Healing Necklace',
        description: 'Increases max HP by 5',
        emoji: '📿',
        cost: 75,
        effects: [{ type: 'maxHp', value: 5 }],
        consumable: false
    },
    VITALITY_NECKLACE: {
        id: 'VITALITY_NECKLACE',
        name: 'Vitality Necklace',
        description: 'Increases max HP by 10',
        emoji: '📿',
        cost: 120,
        effects: [{ type: 'maxHp', value: 10 }],
        consumable: false
    }
};
