export class Player {
    private _hp: number;
    private _maxHp: number;
    private _mp: number;
    private _maxMp: number;
    private _level: number;
    private _experience: number;
    private _gold: number;

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

    // Save/Load methods
    serialize(): object {
        return {
            hp: this._hp,
            maxHp: this._maxHp,
            mp: this._mp,
            maxMp: this._maxMp,
            level: this._level,
            experience: this._experience,
            gold: this._gold
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
        return player;
    }
}
