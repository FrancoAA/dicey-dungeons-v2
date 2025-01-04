import Phaser from 'phaser';
import { DiceType } from '../types/GameTypes';
import { Player } from '../game/Player';
import { Monster, MonsterTypes, BossTypes } from '../game/Monster';
import { DiceManager, DiceResult } from '../game/DiceManager';

export default class BattleScene extends Phaser.Scene {
    private player!: Player;
    private monster!: Monster;
    private diceManager: DiceManager;
    private diceSprites: Phaser.GameObjects.Text[] = [];
    private diceLocks: Phaser.GameObjects.Text[] = [];
    private rerollsLeft: number = 2;
    private currentRoom!: number;
    private monsterNextAttack!: number;
    
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
        this.diceManager = new DiceManager();
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

        this.monsterNextAttack = this.monster.calculateAttack();
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

        this.monsterNextAttackText = this.add.text(width - 200, 50, `Next Attack: ${this.monsterNextAttack}`, { 
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
        // Clear existing dice
        this.diceSprites.forEach(sprite => sprite.destroy());
        this.diceSprites = [];
        this.diceLocks.forEach(lock => lock?.destroy());
        this.diceLocks = [];

        // Roll new dice
        this.diceManager.roll();
        const dice = this.diceManager.getDice();
        const lockedDice = this.diceManager.getDiceLocks();

        // Display dice
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const diceSpacing = 80;
        const startX = width / 2 - (diceSpacing * 2);
        const diceY = height - 150;

        dice.forEach((die, index) => {
            let emoji = '⚔️';
            switch (die.type) {
                case DiceType.DEFENSE: emoji = '🛡️'; break;
                case DiceType.MAGIC: emoji = '✨'; break;
                case DiceType.HEALTH: emoji = '❤️'; break;
            }

            const diceSprite = this.add.text(startX + (diceSpacing * index), diceY, emoji, {
                font: '48px Arial'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.toggleDiceLock(index));

            this.diceSprites[index] = diceSprite;

            // Add lock emoji if die is locked
            if (lockedDice[index]) {
                const lockSprite = this.add.text(startX + (diceSpacing * index), diceY + 40, '🔒', {
                    font: '24px Arial'
                }).setOrigin(0.5);
                this.diceLocks[index] = lockSprite;
            }
        });

        this.updateEffectPreview();
        this.updateUI();
    }

    private updateEffectPreview(): void {
        const preview = this.diceManager.getEffectPreview();
        this.effectPreviewText.setText(preview);
    }

    private toggleDiceLock(index: number): void {
        if (this.rerollsLeft > 0) {
            this.diceManager.toggleLock(index);
            
            // Update lock display
            if (this.diceLocks[index]) {
                this.diceLocks[index].destroy();
                this.diceLocks[index] = null;
            }
            
            if (this.diceManager.getDiceLocks()[index]) {
                const diceSprite = this.diceSprites[index];
                const lockSprite = this.add.text(diceSprite.x, diceSprite.y + 40, '🔒', {
                    font: '24px Arial'
                }).setOrigin(0.5);
                this.diceLocks[index] = lockSprite;
            }
        }
    }

    private rerollDice(): void {
        if (this.rerollsLeft > 0) {
            this.rerollsLeft--;
            this.rollDice();
        }
    }

    private processDiceCombination(): void {
        console.log('------ Player Turn Start ------');
        console.log(`Current Player Stats: HP: ${this.player.hp}/${this.player.maxHp}, MP: ${this.player.mp}/${this.player.maxMp}`);
        console.log(`Monster Stats: ${this.monster.name} HP: ${this.monster.hp}/${this.monster.maxHp}`);

        const effects = this.diceManager.calculateEffects();
        console.log('Calculated Effects:', effects);

        // Process attack damage
        if (effects.damage > 0) {
            console.log(`Attack: ${effects.damage} damage`);
            this.monster.takeDamage(effects.damage);
            this.showFloatingText(this.monsterHPText.x, this.monsterHPText.y, `-${effects.damage}`, '#ff0000');
        }

        // Process magic damage
        if (effects.magicDamage > 0 && effects.magicCost > 0) {
            console.log(`Magic Attack Attempt: Cost: ${effects.magicCost} MP, Damage: ${effects.magicDamage}`);
            if (this.player.useMp(effects.magicCost)) {
                console.log(`Magic Attack Success: Dealt ${effects.magicDamage} magic damage`);
                this.monster.takeDamage(effects.magicDamage);
                this.showFloatingText(this.monsterHPText.x, this.monsterHPText.y, `-${effects.magicDamage}`, '#8800ff');
            } else {
                console.log('Magic Attack Failed: Not enough MP');
            }
        }

        // Process healing
        if (effects.healing !== 0) {
            const healAmount = effects.healing === -1 ? 
                this.player.maxHp - this.player.hp : effects.healing;
            
            if (healAmount > 0) {
                console.log(`Healing: ${healAmount}`);
                this.player.heal(healAmount);
                this.showFloatingText(this.playerHPText.x, this.playerHPText.y, `+${healAmount}`, '#00ff00');
            }
        }

        // Reset dice locks
        this.diceManager.resetLocks();
        this.diceLocks.forEach(lock => {
            if (lock) lock.destroy();
        });
        this.diceLocks = [];

        this.updateUI();

        console.log(`End of Player Turn - Monster HP: ${this.monster.hp}/${this.monster.maxHp}`);

        // Check for victory
        if (this.monster.isDead()) {
            console.log('Victory! Monster defeated!');
            this.victory();
            return;
        }

        // Monster's turn
        this.time.delayedCall(1000, () => {
            this.monsterTurn(effects.defense);
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
        console.log('------ Monster Turn Start ------');
        console.log(`Monster Attack Roll: ${this.monsterNextAttack}`);
        console.log(`Player Defense: ${playerDefense}`);
        
        const damage = Math.max(0, this.monsterNextAttack - playerDefense);
        console.log(`Final Damage After Defense: ${damage}`);

        if (damage > 0) {
            this.player.takeDamage(damage);
            this.showFloatingText(this.playerHPText.x, this.playerHPText.y, `-${damage}`, '#ff0000');
            console.log(`Player took ${damage} damage. HP now: ${this.player.hp}/${this.player.maxHp}`);
        } else {
            console.log('Attack blocked by player defense!');
        }

        this.updateUI();

        if (this.player.hp <= 0) {
            console.log('Game Over - Player defeated');
            this.defeat();
        } else {
            // Set up next turn
            this.monsterNextAttack = this.monster.calculateAttack();
            console.log(`Monster prepares next attack: ${this.monsterNextAttack}`);
            this.monsterNextAttackText.setText(`Next Attack: ${this.monsterNextAttack}`);
            this.rerollsLeft = 2;
            this.rollDice();
            this.updateUI();
            console.log('------ Turn End ------\n');
        }
    }

    private createDialog(title: string, content: string, btnText: string, buttonCallback: () => void): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const dialogWidth = 400;
        const dialogHeight = 300;

        // Create semi-transparent background
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0);

        // Create dialog background
        const dialog = this.add.rectangle(
            width / 2,
            height / 2,
            dialogWidth,
            dialogHeight,
            0x333333,
            1
        );
        dialog.setOrigin(0.5);

        // Add white border to dialog
        const border = this.add.rectangle(
            width / 2,
            height / 2,
            dialogWidth + 4,
            dialogHeight + 4,
            0xffffff,
            1
        );
        border.setOrigin(0.5);
        border.setDepth(-1);

        // Add title
        const titleText = this.add.text(width / 2, height / 2 - 100, title, {
            font: 'bold 36px Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add content
        const contentText = this.add.text(width / 2, height / 2, content, {
            font: '24px Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add button
        const button = this.add.rectangle(
            width / 2,
            height / 2 + 80,
            200,
            40,
            0x4a90e2
        );
        const _buttonText = this.add.text(width / 2, height / 2 + 80, btnText, {
            font: 'bold 20px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        button.setOrigin(0.5);
        button.setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.setFillStyle(0x357abd))
            .on('pointerout', () => button.setFillStyle(0x4a90e2))
            .on('pointerdown', () => {
                // Clean up dialog elements
                [overlay, dialog, border, titleText, contentText, button, _buttonText].forEach(obj => obj.destroy());
                buttonCallback();
            });
        
    }

    private victory(): void {
        const experienceGained = this.monster.experienceReward;
        const goldGained = this.monster.goldReward;
        
        console.log('------ Battle Rewards ------');
        console.log(`Experience gained: ${experienceGained}`);
        console.log(`Gold gained: ${goldGained}`);
        
        this.player.addGold(goldGained);
        const leveledUp = this.player.gainExperience(experienceGained);
        
        if (leveledUp) {
            console.log(`Level Up! Player is now level ${this.player.level}`);
        }

        const content = 
            `💰 +${goldGained} Gold\n` +
            `✨ +${experienceGained} XP\n` +
            (leveledUp ? '🌟 Level Up!' : '');

        this.createDialog(
            '🏆 Victory!',
            content,
            'Continue ▶️',
            () => {
                this.scene.start('DungeonScene', { 
                    player: this.player,
                    currentRoom: this.currentRoom + 1,
                    continueGame: true 
                });
            }
        );
    }

    private defeat(): void {
        this.createDialog(
            '💀 Defeat!',
            'Your journey ends here...\nBetter luck next time!',
            'Return to Menu',
            () => {
                this.scene.start('MainMenuScene');
            }
        );
    }
}
