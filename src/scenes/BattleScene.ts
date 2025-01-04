import Phaser from 'phaser';
import { PlayerStats, DiceType, DiceResult } from '../types/GameTypes';

export default class BattleScene extends Phaser.Scene {
    private player!: PlayerStats;
    private dice: DiceResult[] = [];
    private rerollsLeft: number = 2;
    private isBoss: boolean = false;
    private monsterHP: number = 0;
    private maxMonsterHP: number = 0;
    private nextMonsterAttack: number = 0;

    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data: { player: PlayerStats; isBoss: boolean }): void {
        this.player = data.player;
        this.isBoss = data.isBoss;
        this.rerollsLeft = 2;
        this.monsterHP = this.isBoss ? 30 : 15;
        this.maxMonsterHP = this.monsterHP;
        this.nextMonsterAttack = this.calculateMonsterAttack();
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create battle UI
        this.createBattleUI();

        // Initial dice roll
        this.rollDice();
    }

    private createBattleUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Player stats
        this.add.text(20, 20, '❤️', { font: '24px Arial' });
        this.add.text(60, 20, `${this.player.hp}/${this.player.maxHp}`, { font: '24px Arial' });
        
        this.add.text(20, 50, '✨', { font: '24px Arial' });
        this.add.text(60, 50, `${this.player.mp}/${this.player.maxMp}`, { font: '24px Arial' });

        // Monster stats
        const monsterEmoji = this.isBoss ? '👑' : '👾';
        this.add.text(width - 200, 20, `${monsterEmoji} HP: ${this.monsterHP}/${this.maxMonsterHP}`, { 
            font: '24px Arial' 
        });
        this.add.text(width - 200, 50, `Next Attack: ${this.nextMonsterAttack}`, { 
            font: '24px Arial' 
        });

        // Reroll button
        if (this.rerollsLeft > 0) {
            const rerollButton = this.add.text(width / 2, height - 50, `🎲 Reroll (${this.rerollsLeft} left)`, {
                font: '24px Arial',
                color: '#ffffff'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => rerollButton.setStyle({ color: '#ff0' }))
                .on('pointerout', () => rerollButton.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => this.rerollDice());
        }
    }

    private rollDice(): void {
        this.dice = [];
        for (let i = 0; i < 5; i++) {
            const value = Phaser.Math.Between(1, 6);
            let type: DiceType;
            
            if (value <= 2) type = DiceType.ATTACK;
            else if (value <= 4) type = DiceType.DEFENSE;
            else if (value === 5) type = DiceType.MAGIC;
            else type = DiceType.HEALTH;

            this.dice.push({
                type,
                value,
                locked: false
            });
        }

        this.showDice();
    }

    private showDice(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Position dice in the center of the screen
        this.dice.forEach((die, index) => {
            const x = width / 2 + (index - 2) * 80;
            const y = height / 2;
            
            const dieText = this.add.text(x, y, die.type, {
                font: '48px Arial'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.toggleDieLock(index));

            if (die.locked) {
                dieText.setStyle({ color: '#ff0' });
            }
        });
    }

    private toggleDieLock(index: number): void {
        this.dice[index].locked = !this.dice[index].locked;
        this.showDice();
    }

    private rerollDice(): void {
        if (this.rerollsLeft <= 0) return;

        // Only reroll unlocked dice
        this.dice.forEach((die, index) => {
            if (!die.locked) {
                const value = Phaser.Math.Between(1, 6);
                let type: DiceType;
                
                if (value <= 2) type = DiceType.ATTACK;
                else if (value <= 4) type = DiceType.DEFENSE;
                else if (value === 5) type = DiceType.MAGIC;
                else type = DiceType.HEALTH;

                this.dice[index] = {
                    type,
                    value,
                    locked: false
                };
            }
        });

        this.rerollsLeft--;
        this.showDice();

        // If no more rerolls, process the final dice combination
        if (this.rerollsLeft === 0) {
            this.processDiceCombination();
        }
    }

    private processDiceCombination(): void {
        // Count dice by type
        const counts = new Map<DiceType, number>();
        this.dice.forEach(die => {
            counts.set(die.type, (counts.get(die.type) || 0) + 1);
        });

        // Process attack dice
        const attackCount = counts.get(DiceType.ATTACK) || 0;
        if (attackCount >= 3) {
            let damage = 0;
            if (attackCount === 5) damage = 8;
            else if (attackCount === 4) damage = 5;
            else damage = 3;

            this.monsterHP -= damage;
            if (this.monsterHP <= 0) {
                this.victory();
            }
        }

        // Process defense dice
        const defenseCount = counts.get(DiceType.DEFENSE) || 0;
        if (defenseCount >= 3) {
            // Apply defense effect for next turn
        }

        // Process magic dice
        const magicCount = counts.get(DiceType.MAGIC) || 0;
        if (magicCount >= 2) {
            // Cast spell based on count
        }

        // Process healing dice
        const healCount = counts.get(DiceType.HEALTH) || 0;
        if (healCount >= 2) {
            let healing = 0;
            if (healCount === 5) healing = this.player.maxHp - this.player.hp;
            else if (healCount === 4) healing = 6;
            else if (healCount === 3) healing = 4;
            else healing = 2;

            this.player.hp = Math.min(this.player.maxHp, this.player.hp + healing);
        }

        // Monster's turn
        this.monsterTurn();
    }

    private calculateMonsterAttack(): number {
        return this.isBoss ? Phaser.Math.Between(4, 8) : Phaser.Math.Between(2, 5);
    }

    private monsterTurn(): void {
        this.player.hp -= this.nextMonsterAttack;
        if (this.player.hp <= 0) {
            this.defeat();
        } else {
            // Set up next turn
            this.nextMonsterAttack = this.calculateMonsterAttack();
            this.rerollsLeft = 2;
            this.rollDice();
        }
    }

    private victory(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 2, '🏆 Victory!', {
            font: 'bold 48px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Return to dungeon scene after delay
        this.time.delayedCall(2000, () => {
            this.scene.start('DungeonScene', { player: this.player });
        });
    }

    private defeat(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 2, '💀 Defeat!', {
            font: 'bold 48px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Return to main menu after delay
        this.time.delayedCall(2000, () => {
            this.scene.start('MainMenuScene');
        });
    }
}
