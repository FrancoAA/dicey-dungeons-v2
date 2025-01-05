import Phaser from 'phaser';
import { RoomType } from '../types/GameTypes';
import { Player } from '../game/Player';
import { ITEMS } from '../game/Item';

export default class DungeonScene extends Phaser.Scene {
    private player!: Player;
    private currentRoom!: number;
    private rooms!: RoomType[];

    constructor() {
        super({ key: 'DungeonScene' });
    }

    init(data?: { player: Player; currentRoom: number; continueGame: boolean }): void {
        if (data?.continueGame) {
            // Continue existing game
            this.player = data.player;
            this.currentRoom = data.currentRoom;
        } else {
            // Start new game
            this.player = new Player();
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
        const width = this.cameras.main.width;

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

        // Fill all rooms except last two (merchant and boss)
        for (let i = 0; i < dungeonLength - 2; i++) {
            const roll = Math.random() * 100;
            if (roll < 35) {  // Increased from original chance
                rooms.push(RoomType.CHEST);
            } else if (roll < 85) {
                rooms.push(RoomType.MONSTER);
            } else {
                rooms.push(RoomType.MERCHANT);
            }
        }

        // Add merchant room before boss
        rooms.push(RoomType.MERCHANT);
        
        // Add boss room at the end
        rooms.push(RoomType.BOSS);

        return rooms;
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
        this.add.text(width / 2, height / 2 + 50, '🛍️ Items for sale:', {
            font: '24px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        const merchantItems = [
            ITEMS.SHARP_SWORD,
            ITEMS.STEEL_SHIELD,
            ITEMS.MAGIC_RING,
            ITEMS.LUCKY_CHARM,
            ITEMS.HEALTH_POTION,
            ITEMS.MAGIC_SCROLL
        ];

        const selectedItems = [...merchantItems]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        selectedItems.forEach((item, index) => {
            this.createMerchantItem(item, index, width, height);
        });

        this.addContinueButton();
    }

    private createMerchantItem(item: any, index: number, width: number, height: number): void {
        const itemText = `${item.emoji} ${item.name} (${item.cost} gold)`;
        const itemButton = this.add.text(width / 2, height / 2 + 90 + (index * 30), itemText, {
            font: '20px Arial',
            color: this.player.gold >= item.cost ? '#ffffff' : '#666666'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        if (this.player.gold >= item.cost) {
            itemButton
                .on('pointerover', () => itemButton.setStyle({ color: '#ff0' }))
                .on('pointerout', () => itemButton.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => {
                    if (this.player.spendGold(item.cost)) {
                        this.player.addItem(item);
                        itemButton.setStyle({ color: '#666666' });
                        itemButton.removeInteractive();
                        this.createUI();
                    }
                });
        }
    }

    private addContinueButton(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

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
}
