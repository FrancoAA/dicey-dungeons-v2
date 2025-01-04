import { DiceType } from '../types/GameTypes';

export interface DiceResult {
    type: DiceType;
}

export interface DiceEffects {
    damage: number;
    defense: number;
    magicDamage: number;
    magicCost: number;
    healing: number;
}

export class DiceManager {
    private dice: DiceResult[] = [];
    private lockedDice: boolean[] = [];

    constructor() {
        this.resetLocks();
    }

    public getDice(): DiceResult[] {
        return [...this.dice];
    }

    public getDiceLocks(): boolean[] {
        return [...this.lockedDice];
    }

    public getEmoji(diceType: DiceType): string {
        switch (diceType) {
            case DiceType.ATTACK: return '⚔️';
            case DiceType.DEFENSE: return '🛡️';
            case DiceType.MAGIC: return '✨';
            case DiceType.HEALTH: return '💝';
            default: return '';
        }
    }

    public toggleLock(index: number): void {
        if (index >= 0 && index < this.lockedDice.length) {
            this.lockedDice[index] = !this.lockedDice[index];
        }
    }

    public resetLocks(): void {
        this.lockedDice = Array(5).fill(false);
    }

    public roll(): void {
        // Initialize dice array if empty
        if (this.dice.length !== 5) {
            this.dice = Array(5).fill(null);
        }

        // Roll new dice or keep locked ones
        for (let i = 0; i < 5; i++) {
            if (!this.lockedDice[i]) {
                const diceTypes = [DiceType.ATTACK, DiceType.DEFENSE, DiceType.MAGIC, DiceType.HEALTH];
                const randomType = diceTypes[Math.floor(Math.random() * diceTypes.length)];
                this.dice[i] = { type: randomType };
            }
        }
    }

    public calculateEffects(): DiceEffects {
        const effects: DiceEffects = {
            damage: 0,
            defense: 0,
            magicDamage: 0,
            magicCost: 0,
            healing: 0
        };

        const counts = new Map<DiceType, number>();
        this.dice.forEach(die => {
            counts.set(die.type, (counts.get(die.type) || 0) + 1);
        });

        // Calculate attack damage
        const attackCount = counts.get(DiceType.ATTACK) || 0;
        if (attackCount >= 3) {
            if (attackCount === 5) effects.damage = 8;
            else if (attackCount === 4) effects.damage = 5;
            else effects.damage = 3;
        }

        // Calculate defense
        const defenseCount = counts.get(DiceType.DEFENSE) || 0;
        if (defenseCount >= 3) {
            if (defenseCount === 5) effects.defense = 999; // Immune
            else if (defenseCount === 4) effects.defense = 5;
            else effects.defense = 3;
        }

        // Calculate magic effects
        const magicCount = counts.get(DiceType.MAGIC) || 0;
        if (magicCount >= 2) {
            if (magicCount === 5) {
                effects.magicCost = 8;
                effects.magicDamage = 12;
            } else if (magicCount === 4) {
                effects.magicCost = 5;
                effects.magicDamage = 8;
            } else if (magicCount === 3) {
                effects.magicCost = 3;
                effects.magicDamage = 5;
            } else {
                effects.magicCost = 2;
                effects.magicDamage = 3;
            }
        }

        // Calculate healing
        const healCount = counts.get(DiceType.HEALTH) || 0;
        if (healCount >= 2) {
            if (healCount === 5) effects.healing = -1; // Special value for full heal
            else if (healCount === 4) effects.healing = 6;
            else if (healCount === 3) effects.healing = 4;
            else effects.healing = 2;
        }

        return effects;
    }

    public getTypeCount(type: DiceType): number {
        return this.dice.filter(die => die.type === type).length;
    }

    public getEffectPreview(): string {
        const effects = this.calculateEffects();
        const messages: string[] = [];

        if (effects.damage > 0) {
            messages.push(`Attack: ${effects.damage} damage`);
        }
        if (effects.defense > 0) {
            messages.push(`Defense: ${effects.defense === 999 ? 'Immune' : effects.defense}`);
        }
        if (effects.magicDamage > 0) {
            messages.push(`Magic: ${effects.magicDamage} damage (${effects.magicCost} MP)`);
        }
        if (effects.healing > 0) {
            messages.push(`Heal: ${effects.healing === -1 ? 'Full' : effects.healing}`);
        }

        return messages.join('\n');
    }
}
