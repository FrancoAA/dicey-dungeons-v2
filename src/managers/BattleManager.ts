import Player from '../game/Player';
import { Monster } from '../game/Monster';
import { DiceManager } from '../game/DiceManager';

export interface BattleEffects {
    damage: number;
    magicDamage: number;
    magicCost: number;
    defense: number;
    healing: number;
}

export class BattleManager {
    constructor(
        private player: Player,
        private monster: Monster,
        private diceManager: DiceManager
    ) {}

    public processTurn(effects: BattleEffects): { 
        playerActions: Array<{ type: string; value: number }>;
        monsterDefeated: boolean;
    } {
        const actions = [];

        // Process attack damage
        if (effects.damage > 0) {
            this.monster.takeDamage(effects.damage);
            actions.push({ type: 'damage', value: effects.damage });
        }

        // Process magic damage
        if (effects.magicDamage > 0 && effects.magicCost > 0) {
            if (this.player.useMp(effects.magicCost)) {
                this.monster.takeDamage(effects.magicDamage);
                actions.push({ type: 'magicDamage', value: effects.magicDamage });
            }
        }

        // Process healing
        if (effects.healing !== 0) {
            const healAmount = effects.healing === -1 ? 
                this.player.maxHp - this.player.hp : effects.healing;
            
            if (healAmount > 0) {
                this.player.heal(healAmount);
                actions.push({ type: 'healing', value: healAmount });
            }
        }

        return {
            playerActions: actions,
            monsterDefeated: this.monster.isDead()
        };
    }

    public processMonsterTurn(playerDefense: number, monsterAttack: number): {
        damage: number;
        nextAttack: number;
    } {
        const damage = Math.max(0, monsterAttack - playerDefense);
        
        if (damage > 0) {
            this.player.takeDamage(damage);
        }

        return {
            damage,
            nextAttack: this.monster.calculateAttack()
        };
    }

    public getRewards(): {
        experience: number;
        gold: number;
        leveledUp: boolean;
    } {
        const experience = this.monster.experienceReward;
        const gold = this.monster.goldReward;
        
        this.player.addGold(gold);
        const leveledUp = this.player.gainExperience(experience);
        
        return { experience, gold, leveledUp };
    }
}
