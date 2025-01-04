import Phaser from 'phaser';
import { PlayerStats, RoomType } from '../types/GameTypes';

export default class DungeonScene extends Phaser.Scene {
    private player!: PlayerStats;
    private currentRoom!: number;
    private rooms!: RoomType[];

    constructor() {
        super({ key: 'DungeonScene' });
    }

    create(): void {
        // Initialize player stats
        this.player = {
            hp: 20,
            maxHp: 20,
            mp: 10,
            maxMp: 10,
            level: 1,
            experience: 0
        };

        // Generate dungeon rooms
        this.currentRoom = 0;
        this.rooms = this.generateDungeon();

        // Create UI
        this.createUI();

        // Show current room
        this.showRoom();
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

    private createUI(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Stats display
        this.add.text(20, 20, '❤️', { font: '24px Arial' });
        this.add.text(60, 20, `${this.player.hp}/${this.player.maxHp}`, { font: '24px Arial' });
        
        this.add.text(20, 50, '✨', { font: '24px Arial' });
        this.add.text(60, 50, `${this.player.mp}/${this.player.maxMp}`, { font: '24px Arial' });

        // Room progress
        this.add.text(width - 150, 20, `Room: ${this.currentRoom + 1}/${this.rooms.length}`, { 
            font: '24px Arial' 
        });
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
            const rewards = ['💰 50 Gold', '🧪 Health Potion', '📜 Magic Scroll'];
            const reward = rewards[Math.floor(Math.random() * rewards.length)];
            
            this.add.text(width / 2, height / 2 + 90, reward, {
                font: '28px Arial',
                color: '#ffd700'
            }).setOrigin(0.5);

            this.addContinueButton();
        } else if (roomType === RoomType.MERCHANT) {
            // Add merchant inventory
            this.add.text(width / 2, height / 2 + 50, '🛍️ Items for sale:', {
                font: '24px Arial',
                color: '#ffffff'
            }).setOrigin(0.5);

            const items = [
                '⚔️ Sharp Sword (100 gold)',
                '🛡️ Steel Shield (80 gold)',
                '🧪 Health Potion (50 gold)'
            ];

            items.forEach((item, index) => {
                this.add.text(width / 2, height / 2 + 90 + (index * 30), item, {
                    font: '20px Arial',
                    color: '#cccccc'
                }).setOrigin(0.5);
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

    private continueToNextRoom(): void {
        this.currentRoom++;
        if (this.currentRoom < this.rooms.length) {
            this.showRoom();
        } else {
            // Victory! (shouldn't happen as boss room should handle this)
            this.scene.start('MainMenuScene');
        }
    }

    private startBattle(): void {
        this.scene.start('BattleScene', { 
            player: this.player,
            isBoss: this.rooms[this.currentRoom] === RoomType.BOSS,
            onComplete: (updatedPlayer: PlayerStats) => {
                this.player = updatedPlayer;
                this.currentRoom++;
                if (this.currentRoom < this.rooms.length) {
                    this.showRoom();
                } else {
                    // Victory!
                    this.scene.start('MainMenuScene');
                }
            }
        });
    }
}
