import Phaser from 'phaser';
import { DiceType } from '../types/GameTypes';
import Player from '../game/Player';
import { Monster, MonsterTypes, BossTypes } from '../game/Monster';
import { DiceManager } from '../game/DiceManager';
import { StatusBar } from '../ui/StatusBar';
import { HealthBar } from '../ui/HealthBar';
import { Dialog } from '../ui/Dialog';
import { BattleManager } from '../managers/BattleManager';
import { BattleAnimations } from '../ui/BattleAnimations';

export default class BattleScene extends Phaser.Scene {
    private player!: Player;
    private monster!: Monster;
    private diceManager: DiceManager;
    private battleManager!: BattleManager;
    private battleAnimations!: BattleAnimations;
    private statusBar!: StatusBar;

    // UI elements
    private diceSprites: Phaser.GameObjects.Text[] = [];
    private diceLocks: Phaser.GameObjects.Text[] = [];
    private rerollsLeft = 2;
    private currentRoom!: number;
    private monsterNextAttack!: number;
    private playerHealthBar!: HealthBar;
    private playerMPBar!: HealthBar;
    private monsterHealthBar!: HealthBar;
    private monsterNextAttackText!: Phaser.GameObjects.Text;
    private rerollButton!: Phaser.GameObjects.Text;
    private playButton!: Phaser.GameObjects.Text;
    private effectPreviewText!: Phaser.GameObjects.Text;
    private playerSprite!: Phaser.GameObjects.Text;
    private monsterSprite!: Phaser.GameObjects.Text;

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
        this.battleManager = new BattleManager(this.player, this.monster, this.diceManager);
        this.battleAnimations = new BattleAnimations(this);
    }

    create(): void {
        const width = this.scale.width;
        const height = this.scale.height;

        // Create UI components
        this.statusBar = new StatusBar(this, this.player, this.currentRoom);
        this.createBattleUI();

        // Initial dice roll
        this.rollDice();
    }

    private createBattleUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const characterX = width / 6;
        const characterY = height / 3;
        const healthBarY = characterY + 70;
        const monsterX = 5 * width / 6;

        // Create character sprites
        this.createCharacterSprites(characterX, characterY, monsterX);

        // Create health bars
        this.createHealthBars(characterX, healthBarY, monsterX);

        // Create dice controls
        this.createDiceControls(width, height);

        // Display equipped items and consumables
        this.displayEquippedItems(characterX - 100, healthBarY + 50);
        this.displayConsumables(width / 3, height / 2);
    }

    private createCharacterSprites(characterX: number, characterY: number, monsterX: number): void {
        this.playerSprite = this.add.text(characterX, characterY, this.player.emoji, { 
            font: '64px Arial' 
        }).setOrigin(0.5);

        this.monsterSprite = this.add.text(monsterX, characterY, this.monster.emoji, { 
            font: '64px Arial' 
        }).setOrigin(0.5);

        // Monster name
        this.add.text(monsterX, characterY - 80, this.monster.name, { 
            font: '24px Arial',
            align: 'center'
        }).setOrigin(0.5);
    }

    private createHealthBars(characterX: number, healthBarY: number, monsterX: number): void {
        // Player HP bar
        this.playerHealthBar = new HealthBar(this, {
            x: characterX,
            y: healthBarY,
            width: 200,
            height: 25,
            color: 0x00ff00,
            initialValue: this.player.hp,
            maxValue: this.player.maxHp,
            label: 'HP'
        });

        // Player MP bar
        this.playerMPBar = new HealthBar(this, {
            x: characterX,
            y: healthBarY + 30,
            width: 200,
            height: 25,
            color: 0x0088ff,
            initialValue: this.player.mp,
            maxValue: this.player.maxMp,
            label: 'MP'
        });

        // Monster HP bar
        this.monsterHealthBar = new HealthBar(this, {
            x: monsterX,
            y: healthBarY,
            width: 200,
            height: 25,
            color: 0xff0000,
            initialValue: this.monster.hp,
            maxValue: this.monster.maxHp,
            label: 'HP'
        });

        // Monster's next attack text
        this.monsterNextAttackText = this.add.text(monsterX, healthBarY + 30, 
            `Next Attack: ${this.monsterNextAttack}`, { 
            font: '24px Arial' 
        }).setOrigin(0.5);
    }

    private createDiceControls(width: number, height: number): void {
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
            const equippedItem = this.add.text(index * 30, 0, item.emoji, {
                font: '20px Arial',
                color: '#cccccc'
            });

            // Make the item interactive and add tooltip
            equippedItem.setInteractive({ useHandCursor: true });

            // Create tooltip text (hidden by default)
            const tooltip = this.add.text(0, 0, item.description, {
                font: '14px Arial',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 5, y: 3 },
            }).setDepth(1);
            tooltip.setVisible(false);

            // Show/hide tooltip on hover
            equippedItem
                .on('pointerover', () => {
                    tooltip.setVisible(true);
                    tooltip.setPosition(equippedItem.x, equippedItem.y + equippedItem.height + 5);
                })
                .on('pointerout', () => {
                    tooltip.setVisible(false);
                });

            equippedItemsContainer.add([equippedItem, tooltip]);
        });
    }

    private displayConsumables(x: number, y: number): void {
        const consumableItems = this.player.inventory.filter(item => item.consumable);
        const itemsContainer = this.add.container(x, y);

        if (consumableItems.length > 0) {
            const title = this.add.text(0, 0, 'Inventory:', {
                font: '16px Arial',
                color: '#ffd700'
            });
            itemsContainer.add(title);

            const GRID_COLS = 4;
            const ITEM_SPACING = 40;

            consumableItems.forEach((item, index) => {
                const row = Math.floor(index / GRID_COLS);
                const col = index % GRID_COLS;

                const itemText = this.add.text(
                    col * ITEM_SPACING,
                    30 + row * ITEM_SPACING,
                    item.emoji,
                    {
                        font: '24px Arial',
                        color: '#cccccc',
                        backgroundColor: '#000000',
                        padding: { x: 5, y: 5 }
                    }
                ).setInteractive({ useHandCursor: true });

                const tooltip = this.add.text(0, 0, `${item.name}\n${item.description}`, {
                    font: '14px Arial',
                    color: '#ffffff',
                    backgroundColor: '#000000',
                    padding: { x: 5, y: 3 },
                    wordWrap: { width: 200 }
                }).setDepth(1).setVisible(false);

                itemText
                    .on('pointerover', () => {
                        itemText.setStyle({ backgroundColor: '#cccccc' });
                        tooltip.setVisible(true);
                        tooltip.setPosition(itemText.x, itemText.y + itemText.height + 5);
                    })
                    .on('pointerout', () => {
                        itemText.setStyle({ backgroundColor: '#000000' });
                        tooltip.setVisible(false);
                    })
                    .on('pointerdown', () => {
                        if (this.player.useItem(item.id)) {
                            itemsContainer.destroy();
                            this.displayConsumables(x, y);
                            this.updateUI();
                        }
                    });

                itemsContainer.add([itemText, tooltip]);
            });
        }
    }

    private updateUI(): void {
        this.statusBar.update();
        this.playerHealthBar.update(this.player.hp, this.player.maxHp);
        this.playerMPBar.update(this.player.mp, this.player.maxMp);
        this.monsterHealthBar.update(this.monster.hp, this.monster.maxHp);
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

    private async processDiceCombination(): Promise<void> {
        const effects = this.diceManager.calculateEffects();
        const result = this.battleManager.processTurn(effects);

        // Process player actions
        for (const action of result.playerActions) {
            switch (action.type) {
                case 'damage':
                    await this.battleAnimations.animateAttack(this.playerSprite, this.monsterSprite);
                    await this.battleAnimations.animateDamage(this.monsterSprite);
                    await this.battleAnimations.showDamageNumber(this.monsterHealthBar.text, action.value, 'physical');
                    break;
                case 'magicDamage':
                    await this.battleAnimations.animateAttack(this.playerSprite, this.monsterSprite);
                    await this.battleAnimations.animateMagic(this.monsterSprite);
                    await this.battleAnimations.showDamageNumber(this.monsterHealthBar.text, action.value, 'magic');
                    break;
                case 'healing':
                    await this.battleAnimations.animateHealing(this.playerSprite);
                    await this.battleAnimations.showHealNumber(this.playerHealthBar.text, action.value);
                    break;
            }
        }

        // Reset dice locks
        this.diceManager.resetLocks();
        this.diceLocks.forEach(lock => lock?.destroy());
        this.diceLocks = [];

        this.updateUI();

        // Check for victory
        if (result.monsterDefeated) {
            this.victory();
            return;
        }

        // Monster's turn
        this.time.delayedCall(1000, () => {
            this.monsterTurn(effects.defense);
        });
    }

    private async monsterTurn(playerDefense: number): Promise<void> {
        const result = this.battleManager.processMonsterTurn(playerDefense, this.monsterNextAttack);

        if (result.damage > 0) {
            await this.battleAnimations.animateAttack(this.monsterSprite, this.playerSprite);
            await this.battleAnimations.animateDamage(this.playerSprite);
            await this.battleAnimations.showDamageNumber(this.playerHealthBar.text, result.damage, 'physical');
        }

        this.updateUI();

        if (this.player.hp <= 0) {
            this.defeat();
        } else {
            // Set up next turn
            this.monsterNextAttack = result.nextAttack;
            this.rerollsLeft = 2;
            this.rollDice();
            this.updateUI();
        }
    }

    private victory(): void {
        const rewards = this.battleManager.getRewards();
        
        const content = 
            `💰 +${rewards.gold} Gold\n` +
            `✨ +${rewards.experience} XP\n` +
            (rewards.leveledUp ? '🌟 Level Up!' : '');

        new Dialog(this, {
            title: '🏆 Victory!',
            content,
            buttonText: 'Continue ▶️',
            onClose: () => {
                this.scene.start('DungeonScene', { 
                    player: this.player,
                    currentRoom: this.currentRoom + 1,
                    continueGame: true 
                });
            }
        });
    }

    private defeat(): void {
        new Dialog(this, {
            title: '💀 Defeat!',
            content: 'Your journey ends here...\nBetter luck next time!',
            buttonText: 'Return to Menu',
            onClose: () => {
                this.scene.start('MainMenuScene');
            }
        });
    }
}
