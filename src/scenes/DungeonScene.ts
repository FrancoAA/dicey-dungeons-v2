import Phaser from 'phaser';
import { RoomType } from '../types/GameTypes';
import Player from '../game/Player';
import { ITEMS } from '../game/Item';

export default class DungeonScene extends Phaser.Scene {
    private player!: Player;
    private currentRoom!: number;
    private rooms!: RoomType[];
    private currentRerollCost: number = 10;

    constructor() {
        super({ key: 'DungeonScene' });
    }

    init(data: { player?: Player; currentRoom?: number; continueGame?: boolean }): void {
        if (data?.continueGame) {
            // Continue existing game
            this.player = data.player!;
            // If the player has reached the last room, reset to the first room
            if (data?.currentRoom && (data.currentRoom > this.rooms.length - 1)) {
                this.currentRoom = 0;
                this.rooms = this.generateDungeon();
            } else {
                this.currentRoom = data.currentRoom!;
            }
        } else if (data?.player) {
            // New game with selected character
            this.player = data.player;
            this.currentRoom = 0;
            this.rooms = this.generateDungeon();
        }
    }

    create(): void {
        // Only generate new dungeon if starting fresh
        if (this.rooms === undefined) {
            this.rooms = this.generateDungeon();
        }

        // Create UI
        this.createUI();

        // Show current room
        this.showRoom();
    }

    private createUI(): void {
        const width = this.scale.width;

        // Clear existing UI
        this.children.getAll().forEach((child) => {
            if (child.y < 100) {
                child.destroy();
            }
        });

        // Stats background
        const padding = 10;
        const statsHeight = 60;
        const background = this.add.rectangle(0, 0, width, statsHeight, 0x000000, 0.7)
            .setOrigin(0, 0);

        // Player stats
        const heartEmoji = '❤️';
        const mpEmoji = '✨';
        const goldEmoji = '💰';
        const levelEmoji = '📊';

        const statsText = this.add.text(padding, padding, 
            `${heartEmoji} ${this.player.hp}/${this.player.maxHp}    ${mpEmoji} ${this.player.mp}/${this.player.maxMp}`, {
            font: '24px Arial',
            color: '#ffffff'
        });

        // Level and gold with improved visibility
        const levelText = this.add.text(width / 2 - 100, padding, 
            `${levelEmoji} Level ${this.player.level}`, {
            font: '24px Arial',
            color: '#ffffff'
        });

        // Gold display with shadow for better contrast
        const goldText = this.add.text(width / 2 + 50, padding, 
            `${goldEmoji} ${this.player.gold} Gold`, {
            font: '24px Arial',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { blur: 2, stroke: true }
        });

        // Room counter
        this.add.text(width - 150, padding, 
            `Room: ${this.currentRoom + 1}/10`, {
            font: '24px Arial',
            color: '#ffffff'
        });
    }

    private generateDungeon(): RoomType[] {
        const dungeonLength = 10;  // Total rooms including boss
        const rooms: RoomType[] = [];
        let hasEncounter = false;

        // Fill all rooms except last two (merchant and boss)
        for (let i = 0; i < dungeonLength - 2; i++) {
            const lastRoom = rooms[rooms.length - 1];
            const roll = Math.random() * 100;

            // If we haven't added an encounter room and we're at least halfway through
            if (!hasEncounter && i >= dungeonLength / 2 && i < dungeonLength - 3) {
                rooms.push(RoomType.ENCOUNTER);
                hasEncounter = true;
                continue;
            }

            // If last room was a chest or merchant, force a monster room
            if (lastRoom === RoomType.CHEST || lastRoom === RoomType.MERCHANT) {
                rooms.push(RoomType.MONSTER);
                continue;
            }

            // Adjust probabilities based on previous room
            if (roll < 35) {  // Chest room (35% chance)
                rooms.push(RoomType.CHEST);
            } else if (roll < 85) {  // Monster room (50% chance)
                rooms.push(RoomType.MONSTER);
            } else {  // Merchant room (15% chance)
                rooms.push(RoomType.MERCHANT);
            }
        }

        // Add merchant room before boss
        rooms.push(RoomType.MERCHANT);

        // Add boss room at the end
        rooms.push(RoomType.BOSS);

        // If we haven't added an encounter room yet, replace a random room (excluding last 2)
        if (!hasEncounter) {
            const replaceIndex = Math.floor(Math.random() * (dungeonLength - 3));
            rooms[replaceIndex] = RoomType.ENCOUNTER;
        }

        return rooms;
    }

    private clearRoomContent(): void {
        this.children.getAll().forEach((child) => {
            // Keep the UI elements at the top
            if (child.y > 100) {
                child.destroy();
            }
        });
    }

    private getRoomInfo(roomType: RoomType): { title: string; emoji: string; description: string } {
        switch (roomType) {
            case RoomType.MONSTER:
                return {
                    title: 'Monster Room',
                    emoji: '👾',
                    description: 'A fearsome monster blocks your path!'
                };
            case RoomType.CHEST:
                return {
                    title: 'Treasure Room',
                    emoji: '💎',
                    description: 'You found a treasure chest!'
                };
            case RoomType.MERCHANT:
                return {
                    title: 'Merchant Room',
                    emoji: '🏪',
                    description: 'A friendly merchant offers their wares.'
                };
            case RoomType.BOSS:
                return {
                    title: 'Boss Room',
                    emoji: '👑',
                    description: 'The dungeon boss awaits...'
                };
            case RoomType.ENCOUNTER:
                return {
                    title: 'Mysterious Room',
                    emoji: '❓',
                    description: 'A strange situation presents itself...'
                };
        }
    }

    private displayRoomTitle(roomInfo: { title: string; emoji: string; description: string }, width: number, height: number): void {
        this.add.text(width / 2, height / 3, `${roomInfo.emoji} ${roomInfo.title}`, {
            font: 'bold 36px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3 + 50, roomInfo.description, {
            font: '24px Arial',
            color: '#cccccc'
        }).setOrigin(0.5);
    }

    private showRoom(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const roomType = this.rooms[this.currentRoom];

        // Clear previous room content
        this.clearRoomContent();

        // Get room info and display title
        const roomInfo = this.getRoomInfo(roomType);
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

    private showBattleRoom(width: number, height: number): void {
        const battleButton = this.add.text(width / 2, height / 2 + 50, '⚔️ Start Battle', {
            font: '32px Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => battleButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => battleButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.startBattle());
    }

    private showChestRoom(width: number, height: number): void {
        this.add.text(width / 2, height / 2 + 50, '🎁 You found:', {
            font: '24px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        const possibleItems = this.getChestRewards();
        const selectedReward = this.selectWeightedReward(possibleItems);
        const rewardText = selectedReward.reward();

        this.add.text(width / 2, height / 2 + 90, rewardText, {
            font: '28px Arial',
            color: '#ffd700'
        }).setOrigin(0.5);

        this.addContinueButton();
    }

    private getChestRewards(): Array<{ weight: number; reward: () => string }> {
        return [
            {
                weight: 40,
                reward: () => {
                    const gold = Math.floor(Math.random() * 30) + 20;
                    this.player.addGold(gold);
                    return `💰 ${gold} Gold`;
                }
            },
            {
                weight: 30,
                reward: () => {
                    this.player.addItem(ITEMS.HEALTH_POTION);
                    return `${ITEMS.HEALTH_POTION.emoji} ${ITEMS.HEALTH_POTION.name}`;
                }
            },
            {
                weight: 20,
                reward: () => {
                    this.player.addItem(ITEMS.MAGIC_SCROLL);
                    return `${ITEMS.MAGIC_SCROLL.emoji} ${ITEMS.MAGIC_SCROLL.name}`;
                }
            },
            {
                weight: 10,
                reward: () => {
                    this.player.addItem(ITEMS.LUCKY_CHARM);
                    return `${ITEMS.LUCKY_CHARM.emoji} ${ITEMS.LUCKY_CHARM.name}`;
                }
            }
        ];
    }

    private selectWeightedReward<T extends { weight: number }>(items: T[]): T {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item;
            }
        }
        
        return items[0]; // Fallback to first item
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
        // Clear previous items if any
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
                        this.createUI();
                    }
                });
        }

        // Add all elements to the container
        container.add([bg, itemTitle, priceText, descText, buyButton]);
    }

    private addContinueButton(): void {
        const width = this.scale.width;
        const height = this.scale.height;

        const continueButton = this.add.text(width / 2, height - 100, '▶️ Continue', {
            font: '32px Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => continueButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => continueButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.continueToNextRoom());
    }

    private startBattle(): void {
        this.scene.start('BattleScene', { 
            player: this.player,
            isBoss: this.rooms[this.currentRoom] === RoomType.BOSS,
            currentRoom: this.currentRoom
        });
    }

    private continueToNextRoom(): void {
        this.currentRoom++;
        if (this.currentRoom < this.rooms.length) {
            this.showRoom();
        } else {
            // Victory! (shouldn't happen as boss room should handle this)
            this.scene.start('MainMenuScene');
        }
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
                            this.player.gold -= 5;
                            if (Math.random() < 0.7) {
                                this.player.maxHp += 2;
                                this.player.hp += 2;
                                return 'The shrine blesses you with increased vitality!';
                            } else {
                                this.player.hp = Math.max(1, this.player.hp - 2);
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
                                this.player.maxMp += 2;
                                this.player.mp += 2;
                                return 'Your magical power increases!';
                            } else if (roll < 0.8) {
                                this.player.mp = Math.max(0, this.player.mp - 1);
                                return 'You feel slightly drained...';
                            } else {
                                this.player.gold += 10;
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
        this.add.text(width / 2, height * 0.3, encounter.title, {
            font: '32px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Description
        this.add.text(width / 2, height * 0.4, encounter.description, {
            font: '24px Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: width * 0.8 }
        }).setOrigin(0.5);

        // Choice buttons
        encounter.choices.forEach((choice, index) => {
            if (!choice.condition || choice.condition()) {
                const button = this.add.text(width / 2, height * (0.6 + index * 0.1), choice.text, {
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
}
