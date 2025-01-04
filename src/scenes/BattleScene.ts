import Phaser from 'phaser';
import { DiceType, DiceResult } from '../types/GameTypes';
import { Player } from '../game/Player';
import { Monster, MonsterTypes, BossTypes } from '../game/Monster';

export default class BattleScene extends Phaser.Scene {
    private player!: Player;
    private monster!: Monster;
    private dice: DiceResult[] = [];
    private diceSprites: Phaser.GameObjects.Text[] = [];
    private rerollsLeft: number = 2;
    private currentRoom!: number;
    
    // UI elements that need updating
    private playerHPText!: Phaser.GameObjects.Text;
    private playerMPText!: Phaser.GameObjects.Text;
    private monsterHPText!: Phaser.GameObjects.Text;
    private monsterNextAttackText!: Phaser.GameObjects.Text;
    private rerollButton!: Phaser.GameObjects.Text;
    private playButton!: Phaser.GameObjects.Text;
    private effectPreviewText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data: { player: Player; isBoss: boolean; currentRoom: number }): void {
        this.player = data.player;
        this.currentRoom = data.currentRoom;
        this.rerollsLeft = 2;

        // Create monster based on whether it's a boss fight
        if (data.isBoss) {
            const bossTypes = Object.values(BossTypes);
            const randomBoss = bossTypes[Math.floor(Math.random() * bossTypes.length)];
            this.monster = new Monster(randomBoss);
        } else {
            const monsterTypes = Object.values(MonsterTypes);
            const randomMonster = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
            this.monster = new Monster(randomMonster);
        }
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
        this.playerHPText = this.add.text(60, 20, `${this.player.hp}/${this.player.maxHp}`, { 
            font: '24px Arial' 
        });
        
        this.add.text(20, 50, '✨', { font: '24px Arial' });
        this.playerMPText = this.add.text(60, 50, `${this.player.mp}/${this.player.maxMp}`, { 
            font: '24px Arial' 
        });

        // Monster stats
        this.monsterHPText = this.add.text(width - 200, 20, 
            `${this.monster.emoji} ${this.monster.name} HP: ${this.monster.hp}/${this.monster.maxHp}`, { 
            font: '24px Arial' 
        });

        const nextAttack = this.monster.calculateAttack();
        this.monsterNextAttackText = this.add.text(width - 200, 50, `Next Attack: ${nextAttack}`, { 
            font: '24px Arial' 
        });

        // Action buttons
        // Play button (always visible)
        this.playButton = this.add.text(width / 2 + 100, height - 50, '▶️ Play Hand', {
            font: '24px Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.playButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => this.playButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.processDiceCombination());

        // Reroll button
        this.rerollButton = this.add.text(width / 2 - 100, height - 50, `🎲 Reroll (${this.rerollsLeft} left)`, {
            font: '24px Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.rerollButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => this.rerollButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.rerollDice());

        // Add effect preview text
        this.effectPreviewText = this.add.text(width / 2, height / 2 + 80, '', {
            font: '20px Arial',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
    }

    private updateUI(): void {
        // Update all UI elements
        this.playerHPText.setText(`${this.player.hp}/${this.player.maxHp}`);
        this.playerMPText.setText(`${this.player.mp}/${this.player.maxMp}`);
        
        this.monsterHPText.setText(
            `${this.monster.emoji} ${this.monster.name} HP: ${this.monster.hp}/${this.monster.maxHp}`
        );
        
        if (this.rerollsLeft > 0) {
            this.rerollButton.setText(`🎲 Reroll (${this.rerollsLeft} left)`);
            this.rerollButton.setVisible(true);
        } else {
            this.rerollButton.setVisible(false);
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
        this.updateUI();
    }

    private showDice(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Clear existing dice
        this.diceSprites.forEach((sprite) => {
            sprite.destroy();
        });
        
        // Position dice in the center of the screen
        this.diceSprites = [];
        this.dice.forEach((die, index) => {
            const x = width / 2 + (index - 2) * 80;
            const y = height / 2;
            
            const dieText = this.add.text(x, y, die.type, {
                font: '48px Arial'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.toggleDieLock(index));

            this.diceSprites.push(dieText);

            if (die.locked) {
                dieText.setStyle({ color: '#ff0' });
            }
        });

        // Update effect preview
        this.updateEffectPreview();
    }

    private updateEffectPreview(): void {
        const counts = new Map<DiceType, number>();
        this.dice.forEach(die => {
            counts.set(die.type, (counts.get(die.type) || 0) + 1);
        });

        const effects: string[] = [];

        // Attack preview
        const attackCount = counts.get(DiceType.ATTACK) || 0;
        if (attackCount >= 3) {
            let damage = 0;
            if (attackCount === 5) damage = 8;
            else if (attackCount === 4) damage = 5;
            else damage = 3;
            effects.push(`⚔️ Deal ${damage} damage`);
        }

        // Defense preview
        const defenseCount = counts.get(DiceType.DEFENSE) || 0;
        if (defenseCount >= 3) {
            if (defenseCount === 5) effects.push(`🛡️ Perfect Defense (immune to next attack)`);
            else if (defenseCount === 4) effects.push(`🛡️ Block ${5} damage`);
            else effects.push(`🛡️ Block ${3} damage`);
        }

        // Magic preview
        const magicCount = counts.get(DiceType.MAGIC) || 0;
        if (magicCount >= 2) {
            let mpCost = 0;
            let magicDamage = 0;
            
            if (magicCount === 5) { mpCost = 8; magicDamage = 12; }
            else if (magicCount === 4) { mpCost = 5; magicDamage = 8; }
            else if (magicCount === 3) { mpCost = 3; magicDamage = 5; }
            else { mpCost = 2; magicDamage = 3; }

            const canCast = this.player.mp >= mpCost;
            effects.push(`✨ ${canCast ? '' : '(Not enough MP) '}Deal ${magicDamage} magic damage (${mpCost} MP)`);
        }

        // Healing preview
        const healCount = counts.get(DiceType.HEALTH) || 0;
        if (healCount >= 2) {
            let healing = 0;
            if (healCount === 5) healing = this.player.maxHp - this.player.hp;
            else if (healCount === 4) healing = 6;
            else if (healCount === 3) healing = 4;
            else healing = 2;

            if (healing > 0) {
                effects.push(`💝 Heal ${healCount === 5 ? 'to full HP' : healing + ' HP'}`);
            }
        }

        // Update the preview text
        if (effects.length > 0) {
            this.effectPreviewText.setText(effects.join('\n'));
        } else {
            this.effectPreviewText.setText('No effect combinations yet');
        }
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
        this.showDice(); // This will also update the effect preview
        this.updateUI();
    }

    private processDiceCombination(): void {
        const counts = new Map<DiceType, number>();
        this.dice.forEach(die => {
            counts.set(die.type, (counts.get(die.type) || 0) + 1);
        });

        let damageDealt = 0;
        let defenseGained = 0;

        // Process attack dice
        const attackCount = counts.get(DiceType.ATTACK) || 0;
        if (attackCount >= 3) {
            if (attackCount === 5) damageDealt = 8;
            else if (attackCount === 4) damageDealt = 5;
            else damageDealt = 3;

            this.monster.takeDamage(damageDealt);
            this.showFloatingText(this.monsterHPText.x, this.monsterHPText.y, `-${damageDealt}`, '#ff0000');
        }

        // Process defense dice
        const defenseCount = counts.get(DiceType.DEFENSE) || 0;
        if (defenseCount >= 3) {
            if (defenseCount === 5) defenseGained = 999; // Immune
            else if (defenseCount === 4) defenseGained = 5;
            else defenseGained = 3;
        }

        // Process magic dice
        const magicCount = counts.get(DiceType.MAGIC) || 0;
        if (magicCount >= 2) {
            let mpCost = 0;
            let magicDamage = 0;
            
            if (magicCount === 5) { mpCost = 8; magicDamage = 12; }
            else if (magicCount === 4) { mpCost = 5; magicDamage = 8; }
            else if (magicCount === 3) { mpCost = 3; magicDamage = 5; }
            else { mpCost = 2; magicDamage = 3; }

            if (this.player.useMp(mpCost)) {
                this.monster.takeDamage(magicDamage);
                this.showFloatingText(this.monsterHPText.x, this.monsterHPText.y, `-${magicDamage}`, '#8800ff');
            }
        }

        // Process healing dice
        const healCount = counts.get(DiceType.HEALTH) || 0;
        if (healCount >= 2) {
            let healing = 0;
            if (healCount === 5) healing = this.player.maxHp - this.player.hp;
            else if (healCount === 4) healing = 6;
            else if (healCount === 3) healing = 4;
            else healing = 2;

            if (healing > 0) {
                this.player.heal(healing);
                this.showFloatingText(this.playerHPText.x, this.playerHPText.y, `+${healing}`, '#00ff00');
            }
        }

        this.updateUI();

        // Check for victory
        if (this.monster.isDead()) {
            this.victory();
            return;
        }

        // Monster's turn
        this.time.delayedCall(1000, () => {
            this.monsterTurn(defenseGained);
        });
    }

    private showFloatingText(x: number, y: number, message: string, color: string): void {
        const text = this.add.text(x, y, message, {
            font: '32px Arial',
            color: color
        }).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    private monsterTurn(playerDefense: number): void {
        const damage = Math.max(0, this.monster.calculateAttack() - playerDefense);
        if (damage > 0) {
            this.player.takeDamage(damage);
            this.showFloatingText(this.playerHPText.x, this.playerHPText.y, `-${damage}`, '#ff0000');
        }

        this.updateUI();

        if (this.player.hp <= 0) {
            this.defeat();
        } else {
            // Set up next turn
            this.monsterNextAttackText.setText(`Next Attack: ${this.monster.calculateAttack()}`);
            this.rerollsLeft = 2;
            this.rollDice();
            this.updateUI();
        }
    }

    private victory(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Award experience and gold
        const experienceGained = this.monster.experienceReward;
        const goldGained = this.monster.goldReward;
        
        this.player.addGold(goldGained);
        const leveledUp = this.player.gainExperience(experienceGained);

        // Show rewards
        const rewardText = this.add.text(width / 2, height / 2 - 50, 
            `🏆 Victory!\n\n💰 +${goldGained} Gold\n✨ +${experienceGained} XP${leveledUp ? '\n🌟 Level Up!' : ''}`, {
            font: 'bold 32px Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Return to dungeon scene after delay
        this.time.delayedCall(2000, () => {
            this.scene.start('DungeonScene', { 
                player: this.player,
                currentRoom: this.currentRoom + 1,
                continueGame: true 
            });
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
