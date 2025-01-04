import Phaser from 'phaser';
import { RoomType } from '../types/GameTypes';
import { Player } from '../game/Player';

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

        // Player stats
        this.add.text(20, 20, '❤️', { font: '24px Arial' });
        this.add.text(60, 20, `${this.player.hp}/${this.player.maxHp}`, { font: '24px Arial' });
        
        this.add.text(20, 50, '✨', { font: '24px Arial' });
        this.add.text(60, 50, `${this.player.mp}/${this.player.maxMp}`, { font: '24px Arial' });

        // Level and gold
        this.add.text(200, 20, `📊 Level ${this.player.level}`, { font: '24px Arial' });
        this.add.text(200, 50, `💰 ${this.player.gold} Gold`, { font: '24px Arial' });

        // Room progress
        this.add.text(width - 150, 20, `Room: ${this.currentRoom + 1}/${this.rooms.length}`, { 
            font: '24px Arial' 
        });
    }

    private generateDungeon(): RoomType[] {
        // Simple dungeon generation - can be made more complex later
        const rooms: RoomType[] = [];
        const totalRooms = 10;

        // Add random rooms
        for (let i = 0; i < totalRooms - 1; i++) {
            const roll = Math.random();
            if (roll < 0.6) rooms.push(RoomType.MONSTER);
            else if (roll < 0.8) rooms.push(RoomType.CHEST);
            else rooms.push(RoomType.MERCHANT);
        }

        // Always add boss room at the end
        rooms.push(RoomType.BOSS);

        return rooms;
    }

    private showRoom(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const roomType = this.rooms[this.currentRoom];

        // Clear previous room content
        this.children.getAll().forEach((child) => {
            // Keep the UI elements at the top
            if (child.y > 100) {
                child.destroy();
            }
        });

        // Room title
        let roomTitle = '';
        let roomEmoji = '';
        let roomDescription = '';

        switch (roomType) {
            case RoomType.MONSTER:
                roomTitle = 'Monster Room';
                roomEmoji = '👾';
                roomDescription = 'A fearsome monster blocks your path!';
                break;
            case RoomType.CHEST:
                roomTitle = 'Treasure Room';
                roomEmoji = '💎';
                roomDescription = 'You found a treasure chest!';
                break;
            case RoomType.MERCHANT:
                roomTitle = 'Merchant Room';
                roomEmoji = '🏪';
                roomDescription = 'A friendly merchant offers their wares.';
                break;
            case RoomType.BOSS:
                roomTitle = 'Boss Room';
                roomEmoji = '👑';
                roomDescription = 'The dungeon boss awaits...';
                break;
        }

        // Add room title
        this.add.text(width / 2, height / 3, `${roomEmoji} ${roomTitle}`, {
            font: 'bold 36px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Add room description
        this.add.text(width / 2, height / 3 + 50, roomDescription, {
            font: '24px Arial',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Add appropriate button based on room type
        if (roomType === RoomType.MONSTER || roomType === RoomType.BOSS) {
            const battleButton = this.add.text(width / 2, height / 2 + 50, '⚔️ Start Battle', {
                font: '32px Arial',
                color: '#ffffff'
            })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerover', () => battleButton.setStyle({ color: '#ff0' }))
                .on('pointerout', () => battleButton.setStyle({ color: '#ffffff' }))
                .on('pointerdown', () => this.startBattle());
        } else if (roomType === RoomType.CHEST) {
            // Add some treasure chest content
            this.add.text(width / 2, height / 2 + 50, '🎁 You found:', {
                font: '24px Arial',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Random reward (gold, health potion, etc.)
            const rewards = [
                { text: '💰 50 Gold', action: () => this.player.addGold(50) },
                { text: '🧪 Health Potion', action: () => this.player.heal(10) },
                { text: '📜 Magic Scroll', action: () => this.player.restoreMp(5) }
            ];
            const reward = rewards[Math.floor(Math.random() * rewards.length)];
            
            this.add.text(width / 2, height / 2 + 90, reward.text, {
                font: '28px Arial',
                color: '#ffd700'
            }).setOrigin(0.5);

            // Apply the reward
            reward.action();

            this.addContinueButton();
        } else if (roomType === RoomType.MERCHANT) {
            // Add merchant inventory
            this.add.text(width / 2, height / 2 + 50, '🛍️ Items for sale:', {
                font: '24px Arial',
                color: '#ffffff'
            }).setOrigin(0.5);

            const items = [
                { text: '⚔️ Sharp Sword (100 gold)', cost: 100, action: () => {} },
                { text: '🛡️ Steel Shield (80 gold)', cost: 80, action: () => {} },
                { text: '🧪 Health Potion (10 gold)', cost: 10, action: () => this.player.heal(10) }
            ];

            items.forEach((item, index) => {
                const itemText = this.add.text(width / 2, height / 2 + 90 + (index * 30), item.text, {
                    font: '20px Arial',
                    color: this.player.gold >= item.cost ? '#cccccc' : '#666666'
                })
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });

                if (this.player.gold >= item.cost) {
                    itemText
                        .on('pointerover', () => itemText.setStyle({ color: '#ff0' }))
                        .on('pointerout', () => itemText.setStyle({ color: '#cccccc' }))
                        .on('pointerdown', () => {
                            if (this.player.spendGold(item.cost)) {
                                item.action();
                                itemText.setStyle({ color: '#666666' });
                                itemText.removeInteractive();
                                // Update gold display
                                this.createUI();
                            }
                        });
                }
            });

            this.addContinueButton();
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
