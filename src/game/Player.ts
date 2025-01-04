import { Item, ItemEffect } from './Item';

export class Player {
    private _hp: number;
    private _maxHp: number;
    private _mp: number;
    private _maxMp: number;
    private _level: number;
    private _experience: number;
    private _gold: number;
    private _inventory: Item[] = [];
    private _equippedItems: Item[] = [];

    constructor() {
        this._hp = 20;
        this._maxHp = 20;
        this._mp = 10;
        this._maxMp = 10;
        this._level = 1;
        this._experience = 0;
        this._gold = 0;
    }

    // Getters
    get hp(): number { return this._hp; }
    get maxHp(): number { return this._maxHp; }
    get mp(): number { return this._mp; }
    get maxMp(): number { return this._maxMp; }
    get level(): number { return this._level; }
    get experience(): number { return this._experience; }
    get gold(): number { return this._gold; }
    get inventory(): Item[] { return [...this._inventory]; }
    get equippedItems(): Item[] { return [...this._equippedItems]; }

    // Health methods
    heal(amount: number): void {
        this._hp = Math.min(this._maxHp, this._hp + amount);
    }

    takeDamage(amount: number): void {
        this._hp = Math.max(0, this._hp - amount);
    }

    // Magic methods
    useMp(amount: number): boolean {
        if (this._mp >= amount) {
            this._mp -= amount;
            return true;
        }
        return false;
    }

    restoreMp(amount: number): void {
        this._mp = Math.min(this._maxMp, this._mp + amount);
    }

    // Experience and leveling
    gainExperience(amount: number): boolean {
        this._experience += amount;
        
        // Check for level up
        const experienceNeeded = this.getExperienceForNextLevel();
        if (this._experience >= experienceNeeded) {
            this.levelUp();
            return true;
        }
        return false;
    }

    private getExperienceForNextLevel(): number {
        // Simple exponential experience curve
        return Math.floor(100 * Math.pow(1.5, this._level - 1));
    }

    private levelUp(): void {
        this._level++;
        // Increase stats
        this._maxHp += 5;
        this._hp = this._maxHp; // Full heal on level up
        this._maxMp += 2;
        this._mp = this._maxMp; // Full MP restore on level up
    }

    // Gold methods
    addGold(amount: number): void {
        this._gold += amount;
    }

    spendGold(amount: number): boolean {
        if (this._gold >= amount) {
            this._gold -= amount;
            return true;
        }
        return false;
    }

    // Item methods
    addItem(item: Item): void {
        // Add to inventory
        this._inventory.push({...item});

        // If it's not consumable and has effects, equip it automatically
        if (!item.consumable) {
            this.equipItem(item.id);
        }
    }

    equipItem(itemId: string): void {
        const item = this._inventory.find(i => i.id === itemId && !i.consumable);
        if (!item || item.equipped) return;

        item.equipped = true;
        this._equippedItems.push(item);

        // Apply permanent effects
        for (const effect of item.effects) {
            this.applyItemEffect(effect);
        }
    }

    unequipItem(itemId: string): void {
        const item = this._inventory.find(i => i.id === itemId);
        if (!item || !item.equipped) return;

        item.equipped = false;
        this._equippedItems = this._equippedItems.filter(i => i.id !== itemId);

        // Remove permanent effects
        for (const effect of item.effects) {
            this.removeItemEffect(effect);
        }
    }

    useItem(itemId: string): boolean {
        const itemIndex = this._inventory.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return false;

        const item = this._inventory[itemIndex];
        if (!item.consumable) return false;

        // Apply consumable effects
        for (const effect of item.effects) {
            this.applyItemEffect(effect);
        }

        // Remove consumable from inventory
        this._inventory.splice(itemIndex, 1);
        return true;
    }

    private applyItemEffect(effect: ItemEffect): void {
        switch (effect.type) {
            case 'maxHp':
                this._maxHp += effect.value;
                this._hp += effect.value;
                break;
            case 'maxMp':
                this._maxMp += effect.value;
                this._mp += effect.value;
                break;
            case 'healing':
                this.heal(effect.value);
                break;
            case 'mp':
                this.restoreMp(effect.value);
                break;
        }
    }

    private removeItemEffect(effect: ItemEffect): void {
        switch (effect.type) {
            case 'maxHp':
                this._maxHp -= effect.value;
                this._hp = Math.min(this._hp, this._maxHp);
                break;
            case 'maxMp':
                this._maxMp -= effect.value;
                this._mp = Math.min(this._mp, this._maxMp);
                break;
        }
    }

    // Calculate total bonus from equipped items
    getBonusForType(type: 'damage' | 'defense' | 'reroll'): number {
        return this._equippedItems.reduce((total, item) => {
            const effect = item.effects.find(e => e.type === type);
            return total + (effect?.value || 0);
        }, 0);
    }

    // Save/Load methods
    serialize(): object {
        return {
            hp: this._hp,
            maxHp: this._maxHp,
            mp: this._mp,
            maxMp: this._maxMp,
            level: this._level,
            experience: this._experience,
            gold: this._gold,
            inventory: this._inventory.map(item => ({...item})),
            equippedItems: this._equippedItems.map(item => ({...item}))
        };
    }

    static deserialize(data: any): Player {
        const player = new Player();
        player._hp = data.hp;
        player._maxHp = data.maxHp;
        player._mp = data.mp;
        player._maxMp = data.maxMp;
        player._level = data.level;
        player._experience = data.experience;
        player._gold = data.gold;
        player._inventory = data.inventory.map(item => ({...item}));
        player._equippedItems = data.equippedItems.map(item => ({...item}));
        return player;
    }
}
