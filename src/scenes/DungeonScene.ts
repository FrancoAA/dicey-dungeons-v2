import Phaser from 'phaser';
import { RoomType } from '../types/GameTypes';
import Player from '../game/Player';
import { ITEMS } from '../game/Item';
import { StatusBar } from '../ui/StatusBar';
import { Dialog } from '../ui/Dialog';
import { DungeonManager } from '../managers/DungeonManager';

export default class DungeonScene extends Phaser.Scene {
    private player!: Player;
    private currentRoom!: number;
    private rooms!: RoomType[];
    private currentRerollCost: number = 10;
    private dungeonManager: DungeonManager;
    private statusBar!: StatusBar;

    constructor() {
        super({ key: 'DungeonScene' });
        this.dungeonManager = new DungeonManager();
    }

    init(data: { player?: Player; currentRoom?: number; continueGame?: boolean }): void {
        if (data?.continueGame) {
            // Continue existing game
            this.player = data.player!;
            // If the player has reached the last room, reset to the first room
            if (data?.currentRoom && (data.currentRoom > this.rooms.length - 1)) {
                this.currentRoom = 0;
                this.rooms = this.dungeonManager.generateDungeon();
            } else {
                this.currentRoom = data.currentRoom!;
            }
        } else if (data?.player) {
            // New game with selected character
            this.player = data.player;
            this.currentRoom = 0;
            this.rooms = this.dungeonManager.generateDungeon();
        }
    }

    create(): void {
        // Only generate new dungeon if starting fresh
        if (this.rooms === undefined) {
            this.rooms = this.dungeonManager.generateDungeon();
        }

        // Create UI
        this.statusBar = new StatusBar(this, this.player, this.currentRoom);
        this.showRoom();
    }

    private showRoom(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const roomType = this.rooms[this.currentRoom];

        // Clear previous room content
        this.clearRoomContent();

        // Get room info and display title
        const roomInfo = this.dungeonManager.getRoomInfo(roomType);
        this.displayRoomTitle(roomInfo, width, height);

        // Handle room specific content
        switch (roomType) {
            case RoomType.MONSTER:
            case RoomType.BOSS:
                this.showBattleRoom(width, height);
                break;
            case RoomType.CHEST:
                this.showChestRoom(width, height);
                break;
            case RoomType.MERCHANT:
                this.showMerchantRoom(width, height);
                break;
            case RoomType.ENCOUNTER:
                this.showEncounterRoom(width, height);
                break;
        }
    }

    private clearRoomContent(): void {
        this.children.getAll().forEach((child) => {
            // Keep the UI elements at the top
            if (child.y > 100) {
                child.destroy();
            }
        });
    }

    private displayRoomTitle(roomInfo: { title: string; emoji: string; description: string }, width: number, height: number): void {
        this.add.text(width / 2, height * 0.2, `${roomInfo.emoji} ${roomInfo.title}`, {
            font: '48px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.2 + 60, roomInfo.description, {
            font: '24px Arial',
            color: '#cccccc'
        }).setOrigin(0.5);
    }

    private showBattleRoom(width: number, height: number): void {
        const battleButton = this.add.text(width / 2, height / 2 + 50, '⚔️ Start Battle', {
            font: '32px Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => battleButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => battleButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.startBattle());
    }

    private showChestRoom(width: number, height: number): void {
        const rewards = this.getChestRewards();
        const selectedReward = this.selectWeightedReward(rewards);
        const rewardText = selectedReward.reward();

        this.add.text(width / 2, height / 2, rewardText, {
            font: '32px Arial',
            color: '#ffd700',
            align: 'center'
        }).setOrigin(0.5);

        this.addContinueButton();
    }

    private getChestRewards(): Array<{ weight: number; reward: () => string }> {
        return [
            {
                weight: 40,
                reward: () => {
                    const gold = Math.floor(Math.random() * 20) + 10;
                    this.player.addGold(gold);
                    return `Found ${gold} gold! 💰`;
                }
            },
            {
                weight: 30,
                reward: () => {
                    this.player.heal(5);
                    return 'Found a healing potion! ❤️ (+5 HP)';
                }
            },
            {
                weight: 30,
                reward: () => {
                    this.player.restoreMp(3);
                    return 'Found a mana potion! ✨ (+3 MP)';
                }
            }
        ];
    }

    private selectWeightedReward<T extends { weight: number }>(items: T[]): T {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item;
        }

        return items[0];
    }

    private showMerchantRoom(width: number, height: number): void {
        const merchantItems = [
            ITEMS.SHARP_SWORD,
            ITEMS.STEEL_SHIELD,
            ITEMS.MAGIC_RING,
            ITEMS.LUCKY_CHARM,
            ITEMS.HEALTH_POTION,
            ITEMS.MAGIC_SCROLL
        ];

        this.displayMerchantItems(merchantItems, width, height);
    }

    private displayMerchantItems(merchantItems: any[], width: number, height: number): void {
        // Clear existing content except UI
        this.clearRoomContent();

        // Select 3 random items
        const selectedItems = [...merchantItems]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        // Calculate positions for horizontal layout
        const itemSpacing = 250;  // Space between items
        const startX = width / 2 - (itemSpacing * (selectedItems.length - 1)) / 2;
        const itemY = height / 2;

        // Display items horizontally
        selectedItems.forEach((item, index) => {
            const itemX = startX + (index * itemSpacing);
            this.createMerchantItem(item, itemX, itemY);
        });

        // Display reroll button
        const rerollButton = this.add.text(width / 2, 2 * (height / 3), `Reroll Items (${this.currentRerollCost} gold)`, {
            font: '20px Arial',
            color: '#ffd700',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        if (this.player.gold >= this.currentRerollCost) {

            rerollButton.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    rerollButton.setStyle({ backgroundColor: '#333333' });
                })
                .on('pointerout', () => {
                    rerollButton.setStyle({ backgroundColor: '#000000' });
                })
                .on('pointerdown', () => {
                    if (this.player.gold >= this.currentRerollCost) {
                        // Deduct gold
                        this.player.spendGold(this.currentRerollCost);
                        this.statusBar.update();
                        
                        // Increase reroll cost for next time
                        if (this.currentRerollCost === 10) {
                            this.currentRerollCost = 25;
                        } else if (this.currentRerollCost === 25) {
                            this.currentRerollCost = 50;
                        } else {
                            this.currentRerollCost = Math.min(this.currentRerollCost + 25, 100);
                        }

                        // Display new items
                        this.displayMerchantItems(merchantItems, width, height);
                    }
                });
        } else {
            // Show disabled reroll button
            rerollButton.setStyle({ color: '#666666', backgroundColor: '#2a2a2a' });
        }

        // Add continue button
        this.addContinueButton();
    }

    private createMerchantItem(item: any, x: number, y: number): void {
        // Create item container
        const container = this.add.container(x, y);

        // Item emoji and name
        const itemTitle = this.add.text(0, -30, `${item.emoji} ${item.name}`, {
            font: '24px Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Price with gold color and shadow
        const priceText = this.add.text(0, 0, `${item.cost} Gold`, {
            font: '20px Arial',
            color: '#ffd700',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { blur: 2, stroke: true }
        }).setOrigin(0.5);

        // Description
        const descText = this.add.text(0, 30, item.description, {
            font: '16px Arial',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: 200 }
        }).setOrigin(0.5);

        // Add background for the item
        const padding = 20;
        const bg = this.add.rectangle(
            0,
            0,
            Math.max(itemTitle.width, priceText.width, descText.width) + padding * 2,
            itemTitle.height + priceText.height + descText.height + padding * 2,
            0x000000,
            0.5
        ).setOrigin(0.5);

        // Buy button
        const buttonY = bg.height / 2 + 10;
        const buyButton = this.add.text(0, buttonY, '🛍️ Buy', {
            font: '20px Arial',
            color: this.player.gold >= item.cost ? '#ffffff' : '#666666',
            backgroundColor: this.player.gold >= item.cost ? '#4a4a4a' : '#2a2a2a',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        if (this.player.gold >= item.cost) {
            buyButton
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    buyButton.setStyle({ backgroundColor: '#666666' });
                })
                .on('pointerout', () => {
                    buyButton.setStyle({ backgroundColor: '#4a4a4a' });
                })
                .on('pointerdown', () => {
                    if (this.player.spendGold(item.cost)) {
                        this.player.addItem(item);
                        buyButton.setStyle({ 
                            color: '#666666',
                            backgroundColor: '#2a2a2a'
                        });
                        buyButton.removeInteractive();
                        // Update gold display
                        this.statusBar.update();
                    }
                });
        }

        // Add all elements to the container
        container.add([bg, itemTitle, priceText, descText, buyButton]);
    }

    private showEncounterRoom(width: number, height: number): void {
        const encounters = [
            {
                title: 'Ancient Shrine',
                description: 'You find a mysterious shrine. Do you want to make an offering?',
                choices: [
                    {
                        text: 'Make an offering (5 gold)',
                        condition: () => this.player.gold >= 5,
                        action: () => {
                            this.player.spendGold(5);
                            if (Math.random() < 0.7) {
                                this.player._maxHp += 2;
                                this.player.heal(2);
                                return 'The shrine blesses you with increased vitality!';
                            } else {
                                this.player.takeDamage(2);
                                return 'The shrine drains some of your life force!';
                            }
                        }
                    },
                    {
                        text: 'Leave it alone',
                        action: () => 'You decide not to tempt fate.'
                    }
                ]
            },
            {
                title: 'Mysterious Potion',
                description: 'You find a bubbling potion. Do you drink it?',
                choices: [
                    {
                        text: 'Drink the potion',
                        action: () => {
                            const roll = Math.random();
                            if (roll < 0.4) {
                                this.player._maxMp += 2;
                                this.player.restoreMp(2);
                                return 'Your magical power increases!';
                            } else if (roll < 0.8) {
                                this.player.useMp(1);
                                return 'You feel slightly drained...';
                            } else {
                                this.player.addGold(10);
                                return 'The potion turns to gold in your stomach!';
                            }
                        }
                    },
                    {
                        text: 'Leave it',
                        action: () => 'Better safe than sorry.'
                    }
                ]
            }
        ];

        const encounter = encounters[Math.floor(Math.random() * encounters.length)];
        
        // Title
        this.add.text(width / 2 , (height * 0.3) + 200, encounter.title, {
            font: '32px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Description
        this.add.text(width / 2, (height * 0.3) + 250, encounter.description, {
            font: '24px Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);

        // Choice buttons
        encounter.choices.forEach((choice, index) => {
            if (!choice.condition || choice.condition()) {
                const button = this.add.text(width / 2, height * (0.7 + index * 0.1), choice.text, {
                    font: '24px Arial',
                    color: '#00ff00',
                    backgroundColor: '#333333',
                    padding: { x: 20, y: 10 }
                })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => button.setColor('#ffffff'))
                .on('pointerout', () => button.setColor('#00ff00'))
                .on('pointerdown', () => {
                    const result = choice.action();
                    this.showEncounterResult(result);
                });
            }
        });
    }

    private showEncounterResult(result: string): void {
        // Clear existing content except UI
        this.clearRoomContent();
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Show result text
        this.add.text(width / 2, height * 0.4, result, {
            font: '28px Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);

        // Add continue button
        this.addContinueButton();
    }

    private addContinueButton(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const continueButton = this.add.text(width / 2, height - 100, '▶️ Continue', {
            font: '32px Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => continueButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => continueButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.continueToNextRoom());
    }

    private startBattle(): void {
        const isBoss = this.rooms[this.currentRoom] === RoomType.BOSS;
        this.scene.start('BattleScene', { 
            player: this.player,
            isBoss,
            currentRoom: this.currentRoom
        });
    }

    private continueToNextRoom(): void {
        this.currentRoom++;
        if (this.currentRoom >= this.rooms.length) {
            // Player has completed the dungeon
            this.scene.start('MainMenuScene');
        } else {
            this.showRoom();
        }
    }
}
