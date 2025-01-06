import Phaser from 'phaser';
import { DiceType } from '../types/GameTypes';
import Player from '../game/Player';
import { Monster, MonsterTypes, BossTypes } from '../game/Monster';
import { DiceManager } from '../game/DiceManager';

export default class BattleScene extends Phaser.Scene {
    private player!: Player;
    private monster!: Monster;
    private diceManager: DiceManager;
    private diceSprites: Phaser.GameObjects.Text[] = [];
    private diceLocks: Phaser.GameObjects.Text[] = [];
    private rerollsLeft = 2;
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
    private levelText!: Phaser.GameObjects.Text;
    private goldText!: Phaser.GameObjects.Text;
    private roomText!: Phaser.GameObjects.Text;

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
        const width = this.scale.width;
        const height = this.scale.height;

        // Create status bar background
        const statusBarHeight = 40;
        const statusBar = this.add.rectangle(0, 0, width, statusBarHeight, 0x000000);
        statusBar.setOrigin(0, 0);
        statusBar.setAlpha(0.8);

        // Add status texts
        this.levelText = this.add.text(20, statusBarHeight / 2, `📊 Level ${this.player.level}`, {
            font: '20px Arial',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.goldText = this.add.text(width / 2, statusBarHeight / 2, `💰 ${this.player.gold} Gold`, {
            font: '20px Arial',
            color: '#ffd700'
        }).setOrigin(0.5, 0.5);

        this.roomText = this.add.text(width - 20, statusBarHeight / 2, `Room: ${this.currentRoom + 1}/10`, {
            font: '20px Arial',
            color: '#ffffff'
        }).setOrigin(1, 0.5);

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
        const width = this.scale.width;
        const height = this.scale.height;

        // Create character sprites
        const characterX = width / 6;
        const characterY = height / 3;
        const healthBarY = characterY + 70;
        const healthBarWidth = 200;
        const healthBarHeight = 25;
        const monsterX = 5 * width / 6;

        this.playerSprite = this.add.text(characterX, characterY, this.player.emoji, { 
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
        const manaBarY = healthBarY + 30;
        const playerMP = this.createHealthBar(
            characterX,
            manaBarY,
            healthBarWidth,
            healthBarHeight,
            0x0088ff,  // Blue color for MP
            this.player.mp,
            this.player.maxMp
        );
        this.playerMPBarBg = playerMP.background;
        this.playerMPBar = playerMP.bar;
        this.playerMPText = playerMP.text;
        this.displayEquippedItems(characterX - healthBarWidth / 2, manaBarY + 20);

        // Display equipped items
        this.displayConsumables(width / 3, height / 2);

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
        //this.monsterHealthBarBg = monsterHealth.background;
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
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
            .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.rerollButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => this.rerollButton.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => this.rerollDice());

        // Play button
        this.playButton = this.add.text(width / 2 + 100, buttonY, '▶️ Play Hand', {
            font: '24px Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.playButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => this.playButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.processDiceCombination());

        // Effect preview text
        this.effectPreviewText = this.add.text(width / 2, height - 170, '', {
            font: '16px Arial',
            color: '#cccccc',
            backgroundColor: '#000000',
            align: 'center',
        }).setOrigin(0.5);
    }

    private displayEquippedItems(x: number, y: number): void {
        const equippedItems = this.player.equippedItems;
        const equippedItemsContainer = this.add.container(x, y);

        equippedItems.forEach((item, index) => {
            const equippedItem = this.add.text(index * 30, 0, `${item.emoji}`, {
                font: '20px Arial',
                color: '#cccccc'
            });

            // Make the item interactive and add tooltip behavior
            equippedItem.setInteractive({ useHandCursor: true });

            // Create tooltip text (hidden by default)
            const tooltip = this.add.text(0, 0, item.description, {
                font: '14px Arial',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 5, y: 3 },
            }).setDepth(1);
            tooltip.setVisible(false);

            // Show tooltip on hover
            equippedItem.on('pointerover', () => {
                tooltip.setVisible(true);
                tooltip.setPosition(equippedItem.x, equippedItem.y + equippedItem.height + 5);
            });

            // Hide tooltip when mouse leaves
            equippedItem.on('pointerout', () => {
                tooltip.setVisible(false);
            });

            equippedItemsContainer.add(equippedItem);
            equippedItemsContainer.add(tooltip);
        });
    }

    private displayConsumables(x: number, y: number): void {
        const consumableItems = this.player.inventory.filter(item => item.consumable);

        // Create container for item display
        const itemsContainer = this.add.container(x, y);

        // Display consumable items
        if (consumableItems.length > 0) {
            const consumableTitle = this.add.text(0, 0, 'Inventory:', {
                font: '16px Arial',
                color: '#ffd700'  // Gold color for better visibility
            });
            itemsContainer.add(consumableTitle);

            const GRID_COLS = 4;  // Number of items per row
            const ITEM_SPACING = 40;  // Space between items

            consumableItems.forEach((item, index) => {
                const row = Math.floor(index / GRID_COLS);
                const col = index % GRID_COLS;

                const itemText = this.add.text(
                    col * ITEM_SPACING,
                    30 + row * ITEM_SPACING,
                    `${item.emoji}`,
                    {
                        font: '24px Arial',
                        color: '#cccccc',
                        backgroundColor: '#000000',
                        padding: { x: 5, y: 5 }
                    }
                );

                // Make consumable items clickable
                itemText.setInteractive({ useHandCursor: true });

                // Create tooltip (hidden by default)
                const tooltip = this.add.text(0, 0, `${item.name}\n${item.description}`, {
                    font: '14px Arial',
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 5, y: 3 },
                    wordWrap: { width: 200 }
                }).setDepth(1);
                tooltip.setVisible(false);

                // Show tooltip on hover
                itemText.on('pointerover', () => {
                    itemText.setStyle({ backgroundColor: '#cccccc' });
                    tooltip.setVisible(true);
                    tooltip.setPosition(itemText.x, itemText.y + itemText.height + 5);
                });

                // Hide tooltip when mouse leaves
                itemText.on('pointerout', () => {
                    itemText.setStyle({ backgroundColor: '#000000' });
                    tooltip.setVisible(false);
                });

                // Handle item use
                itemText.on('pointerdown', () => {
                    if (this.player.useItem(item.id)) {
                        // Refresh the display after using an item
                        itemsContainer.destroy();
                        this.displayConsumables(x, y);
                        // Update health/mana bars
                        this.updateUI();
                    }
                });

                itemsContainer.add(itemText);
                itemsContainer.add(tooltip);
            });
        }
    }

    private updateUI(): void {
        // Update status bar
        this.levelText.setText(`📊 Level ${this.player.level}`);
        this.goldText.setText(`💰 ${this.player.gold} Gold`);
        this.roomText.setText(`Room: ${this.currentRoom + 1}/10`);

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
        const diceY = height - 250;

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

    private async animateAttack(attacker: Phaser.GameObjects.Text, target: Phaser.GameObjects.Text): Promise<void> {
        const originalX = attacker.x;
        const direction = attacker.x < target.x ? 1 : -1;
        
        // Quick lunge animation
        await new Promise<void>(resolve => {
            this.tweens.add({
                targets: attacker,
                x: attacker.x + (50 * direction),
                duration: 100,
                ease: 'Power1',
                yoyo: true,
                onComplete: () => {
                    attacker.x = originalX;
                    resolve();
                }
            });
        });
    }

    private async animateDamage(target: Phaser.GameObjects.Text): Promise<void> {
        const originalTint = target.style.color;
        
        // Flash red and shake
        target.setStyle({ color: '#ff0000' });
        
        await new Promise<void>(resolve => {
            this.tweens.add({
                targets: target,
                x: target.x + 10,
                duration: 50,
                ease: 'Power1',
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    target.setStyle({ color: originalTint });
                    resolve();
                }
            });
        });
    }

    private async animateHealing(target: Phaser.GameObjects.Text): Promise<void> {
        // Create healing particles
        const particles = this.add.particles(target.x, target.y, '✨', {
            speed: 100,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            gravityY: -100,
            quantity: 1,
            frequency: 100,
            duration: 800
        });

        await new Promise<void>(resolve => {
            this.time.delayedCall(800, () => {
                particles.destroy();
                resolve();
            });
        });
    }

    private async animateMagic(target: Phaser.GameObjects.Text): Promise<void> {
        // Create magic circle effect
        const circle = this.add.circle(target.x, target.y, 40, 0x4444ff, 0.3);
        circle.setAlpha(0);

        await new Promise<void>(resolve => {
            this.tweens.add({
                targets: circle,
                alpha: 0.5,
                scale: 1.5,
                duration: 500,
                ease: 'Power2',
                yoyo: true,
                onComplete: () => {
                    circle.destroy();
                    resolve();
                }
            });
        });
    }

    private async applyDamage(target: Phaser.GameObjects.Text, amount: number, type: 'physical' | 'magic'): Promise<void> {
        if (type === 'physical') {
            await this.animateDamage(target);
        } else {
            await this.animateMagic(target);
        }
        
        // Show damage number
        const damageText = this.add.text(target.x, target.y - 20, `-${amount}`, {
            font: '24px Arial',
            color: type === 'physical' ? '#ff0000' : '#4444ff'
        }).setOrigin(0.5);

        await new Promise<void>(resolve => {
            this.tweens.add({
                targets: damageText,
                y: damageText.y - 30,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    damageText.destroy();
                    resolve();
                }
            });
        });
    }

    private async applyHealing(target: Phaser.GameObjects.Text, amount: number): Promise<void> {
        await this.animateHealing(target);
        
        // Show healing number
        const healText = this.add.text(target.x, target.y - 20, `+${amount}`, {
            font: '24px Arial',
            color: '#00ff00'
        }).setOrigin(0.5);

        await new Promise<void>(resolve => {
            this.tweens.add({
                targets: healText,
                y: healText.y - 30,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    healText.destroy();
                    resolve();
                }
            });
        });
    }

    private async processDiceCombination(): Promise<void> {
        console.log('------ Player Turn Start ------');
        console.log(`Current Player Stats: HP: ${this.player.hp}/${this.player.maxHp}, MP: ${this.player.mp}/${this.player.maxMp}`);
        console.log(`Monster Stats: ${this.monster.name} HP: ${this.monster.hp}/${this.monster.maxHp}`);

        const effects = this.diceManager.calculateEffects();
        console.log('Calculated Effects:', effects);

        // Process attack damage
        if (effects.damage > 0) {
            console.log(`Attack: ${effects.damage} damage`);
            await this.animateAttack(this.playerSprite, this.monsterSprite);
            await this.applyDamage(this.monsterHPText, effects.damage, 'physical');
            this.monster.takeDamage(effects.damage);
        }

        // Process magic damage
        if (effects.magicDamage > 0 && effects.magicCost > 0) {
            console.log(`Magic Attack Attempt: Cost: ${effects.magicCost} MP, Damage: ${effects.magicDamage}`);
            if (this.player.useMp(effects.magicCost)) {
                console.log(`Magic Attack Success: Dealt ${effects.magicDamage} magic damage`);
                await this.animateAttack(this.playerSprite, this.monsterSprite);
                await this.applyDamage(this.monsterHPText, effects.magicDamage, 'magic');
                this.monster.takeDamage(effects.magicDamage);
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
                await this.applyHealing(this.playerHPText, healAmount);
                this.player.heal(healAmount);
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

    private async monsterTurn(playerDefense: number): Promise<void> {
        console.log('------ Monster Turn Start ------');
        console.log(`Monster Attack Roll: ${this.monsterNextAttack}`);
        console.log(`Player Defense: ${playerDefense}`);
        
        const damage = Math.max(0, this.monsterNextAttack - playerDefense);
        console.log(`Final Damage After Defense: ${damage}`);

        if (damage > 0) {
            await this.animateAttack(this.monsterSprite, this.playerSprite);
            await this.applyDamage(this.playerHPText, damage, 'physical');
            this.player.takeDamage(damage);
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
