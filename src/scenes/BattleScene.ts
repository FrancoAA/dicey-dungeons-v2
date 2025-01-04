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
    private playerSprite!: Phaser.GameObjects.Text;
    private monsterSprite!: Phaser.GameObjects.Text;
    private playerHealthBar!: Phaser.GameObjects.Rectangle;
    private playerHealthBarBg!: Phaser.GameObjects.Rectangle;
    private playerMPBar!: Phaser.GameObjects.Rectangle;
    private playerMPBarBg!: Phaser.GameObjects.Rectangle;
    private monsterHealthBar!: Phaser.GameObjects.Rectangle;
    private monsterHealthBarBg!: Phaser.GameObjects.Rectangle;

    constructor() {
        super({ key: 'BattleScene' });
        this.diceManager = new DiceManager(this.player);
    }

    init(data: { player: Player; isBoss: boolean; currentRoom: number }): void {
        this.player = data.player;
        this.currentRoom = data.currentRoom;
        this.diceManager = new DiceManager(this.player);
        this.rerollsLeft = 2;
        this.rerollsLeft += this.player.getBonusForType('reroll');

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
        // Create battle UI
        this.createBattleUI();

        // Initial dice roll
        this.rollDice();
    }

    private createHealthBar(x: number, y: number, width: number, height: number, color: number, initialHP: number, maxHP: number): {
        background: Phaser.GameObjects.Rectangle,
        bar: Phaser.GameObjects.Rectangle,
        text: Phaser.GameObjects.Text
    } {
        // Create background
        const background = this.add.rectangle(
            x - width/2,  // Adjust x position for left alignment
            y,
            width,
            height,
            0x666666
        ).setOrigin(0, 0.5);  // Set origin to left center

        // Create health bar
        const bar = this.add.rectangle(
            x - width/2,  // Align with background
            y,
            width,
            height,
            color
        ).setOrigin(0, 0.5);  // Set origin to left center

        // Create HP text
        const text = this.add.text(x, y, 
            `${initialHP}/${maxHP}`, { 
            font: '16px Arial',
            color: '#000000'
        }).setOrigin(0.5);

        return { background, bar, text };
    }

    private createBattleUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Create character sprites
        const characterX = width / 6;
        const characterY = height / 2 - 50;
        const healthBarY = characterY + 70;
        const healthBarWidth = 200;
        const healthBarHeight = 25;
        const monsterX = 5 * width / 6;

        this.playerSprite = this.add.text(characterX, characterY, '🧙‍♂️', { 
            font: '64px Arial' 
        }).setOrigin(0.5);

        // Create player health bar
        const playerHealth = this.createHealthBar(
            characterX,
            healthBarY,
            healthBarWidth,
            healthBarHeight,
            0x00ff00,
            this.player.hp,
            this.player.maxHp
        );
        this.playerHealthBarBg = playerHealth.background;
        this.playerHealthBar = playerHealth.bar;
        this.playerHPText = playerHealth.text;
        
        // Create player MP bar
        const playerMP = this.createHealthBar(
            characterX,
            healthBarY + 30,
            healthBarWidth,
            healthBarHeight,
            0x0088ff,  // Blue color for MP
            this.player.mp,
            this.player.maxMp
        );
        this.playerMPBarBg = playerMP.background;
        this.playerMPBar = playerMP.bar;
        this.playerMPText = playerMP.text;

        // Display equipped items
        this.displayEquippedItems(characterX, healthBarY + 60);

        // Monster sprite and health
        this.monsterSprite = this.add.text(monsterX, characterY, this.monster.emoji, { 
            font: '64px Arial' 
        }).setOrigin(0.5);

        // Monster name
        this.add.text(monsterX, characterY - 80, 
            `${this.monster.name}`, { 
            font: '24px Arial',
            align: 'center'
        }).setOrigin(0.5);

        // Create monster health bar
        const monsterHealth = this.createHealthBar(
            monsterX,
            healthBarY,
            healthBarWidth,
            healthBarHeight,
            0xff0000,
            this.monster.hp,
            this.monster.maxHp
        );
        this.monsterHealthBarBg = monsterHealth.background;
        this.monsterHealthBar = monsterHealth.bar;
        this.monsterHPText = monsterHealth.text;

        // Monster's next attack text (below health bar)
        this.monsterNextAttackText = this.add.text(monsterX, healthBarY + 30, 
            `Next Attack: ${this.monsterNextAttack}`, { 
            font: '24px Arial' 
        }).setOrigin(0.5);

        // Dice controls at the bottom
        const buttonY = height - 50;
        
        // Reroll button
        this.rerollButton = this.add.text(width / 2 - 100, buttonY, `🎲 Reroll (${this.rerollsLeft} left)`, {
            font: '24px Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.rerollButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => this.rerollButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.rerollDice());

        // Play button
        this.playButton = this.add.text(width / 2 + 100, buttonY, '▶️ Play Hand', {
            font: '24px Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.playButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => this.playButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.processDiceCombination());

        // Effect preview text
        this.effectPreviewText = this.add.text(width / 2, height / 2 + 80, '', {
            font: '20px Arial',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
    }

    private displayEquippedItems(x: number, y: number): void {
        const equippedItems = this.player.equippedItems;
        const consumableItems = this.player.inventory.filter(item => item.consumable);

        // Create container for item display
        const itemsContainer = this.add.container(x - 150, y);

        // Display equipped items
        if (equippedItems.length > 0) {
            const equippedTitle = this.add.text(0, 0, 'Equipped:', {
                font: '16px Arial',
                color: '#ffffff'
            });
            itemsContainer.add(equippedTitle);

            equippedItems.forEach((item, index) => {
                const itemText = this.add.text(0, 20 + index * 20, `${item.emoji} ${item.name}`, {
                    font: '14px Arial',
                    color: '#cccccc'
                });
                
                // Add tooltip with item description
                itemText.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => {
                        itemText.setStyle({ color: '#ffffff' });
                        const tooltip = this.add.text(itemText.x + 150, itemText.y, item.description, {
                            font: '12px Arial',
                            color: '#ffff00',
                            backgroundColor: '#000000',
                            padding: { x: 5, y: 3 }
                        });
                        itemText.tooltip = tooltip;
                    })
                    .on('pointerout', () => {
                        itemText.setStyle({ color: '#cccccc' });
                        if (itemText.tooltip) {
                            itemText.tooltip.destroy();
                            itemText.tooltip = null;
                        }
                    });

                itemsContainer.add(itemText);
            });
        }

        // Display consumable items
        if (consumableItems.length > 0) {
            const consumableTitle = this.add.text(300, 0, 'Items:', {
                font: '16px Arial',
                color: '#ffffff'
            });
            itemsContainer.add(consumableTitle);

            consumableItems.forEach((item, index) => {
                const itemText = this.add.text(300, 20 + index * 20, `${item.emoji} ${item.name}`, {
                    font: '14px Arial',
                    color: '#cccccc'
                });

                // Make consumable items clickable
                itemText.setInteractive({ useHandCursor: true })
                    .on('pointerover', () => {
                        itemText.setStyle({ color: '#ffffff' });
                        const tooltip = this.add.text(itemText.x + 150, itemText.y, item.description, {
                            font: '12px Arial',
                            color: '#ffff00',
                            backgroundColor: '#000000',
                            padding: { x: 5, y: 3 }
                        });
                        itemText.tooltip = tooltip;
                    })
                    .on('pointerout', () => {
                        itemText.setStyle({ color: '#cccccc' });
                        if (itemText.tooltip) {
                            itemText.tooltip.destroy();
                            itemText.tooltip = null;
                        }
                    })
                    .on('pointerdown', () => {
                        if (this.player.useItem(item.id)) {
                            // Refresh the display after using an item
                            itemsContainer.destroy();
                            this.displayEquippedItems(x, y);
                            // Update health/mana bars
                            this.updateUI();
                        }
                    });

                itemsContainer.add(itemText);
            });
        }
    }

    private updateUI(): void {
        // Update health bars
        const playerHealthPercent = this.player.hp / this.player.maxHp;
        const monsterHealthPercent = this.monster.hp / this.monster.maxHp;
        const playerMPPercent = this.player.mp / this.player.maxMp;

        // Scale health bars from right to left
        this.playerHealthBar.setScale(playerHealthPercent, 1);
        this.playerHealthBar.setOrigin(0, 0.5);
        
        this.playerMPBar.setScale(playerMPPercent, 1);
        this.playerMPBar.setOrigin(0, 0.5);
        
        this.monsterHealthBar.setScale(monsterHealthPercent, 1);
        this.monsterHealthBar.setOrigin(0, 0.5);

        // Update text displays
        this.playerHPText.setText(`${this.player.hp}/${this.player.maxHp} Hp`);
        this.playerMPText.setText(`${this.player.mp}/${this.player.maxMp} Mp`);
        this.monsterHPText.setText(`${this.monster.hp}/${this.monster.maxHp} Hp`);
        this.monsterNextAttackText.setText(`Next Attack: ${this.monsterNextAttack}`);
        
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
            const emoji = this.diceManager.getEmoji(die.type);

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
