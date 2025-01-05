import { Scene } from 'phaser';
import Player, { CharacterClass } from '../game/Player';

export default class CharacterSelectScene extends Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    create(): void {
        const width = this.scale.width;
        const height = this.scale.height;

        // Title
        const title = this.add.text(width / 2, height * 0.1, 'Choose Your Character', {
            font: '32px Arial',
            color: '#ffd700'
        }).setOrigin(0.5);

        const characters = [
            {
                class: CharacterClass.KNIGHT,
                name: 'Knight',
                emoji: '⚔️',
                description: 'A sturdy warrior with high HP.\nSpecializes in defensive abilities.',
                stats: 'HP: 25  MP: 5'
            },
            {
                class: CharacterClass.MAGE,
                name: 'Mage',
                emoji: '🔮',
                description: 'A powerful spellcaster with high MP.\nExcels at magical attacks.',
                stats: 'HP: 15  MP: 15'
            },
            {
                class: CharacterClass.SORCERER,
                name: 'Sorcerer',
                emoji: '🎭',
                description: 'A balanced character with unique abilities.\nMaster of transformation spells.',
                stats: 'HP: 20  MP: 10'
            }
        ];

        characters.forEach((char, index) => {
            const x = width * (0.25 + index * 0.27);
            const y = height * 0.4;

            // Character container
            const container = this.add.container(x, y);

            // Character emoji
            const emoji = this.add.text(0, 0, char.emoji, {
                font: '64px Arial',
                color: '#ffffff'
            }).setOrigin(0.5);

            // Character name
            const name = this.add.text(0, 80, char.name, {
                font: '24px Arial',
                color: '#ffd700'
            }).setOrigin(0.5);

            // Character stats
            const stats = this.add.text(0, 110, char.stats, {
                font: '16px Arial',
                color: '#cccccc'
            }).setOrigin(0.5);

            // Character description
            const description = this.add.text(0, 150, char.description, {
                font: '14px Arial',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: 200 }
            }).setOrigin(0.5);

            container.add([emoji, name, stats, description]);

            // Make the container interactive
            const hitArea = this.add.rectangle(0, 0, 200, 250, 0x000000, 0)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            container.add(hitArea);

            // Highlight on hover
            hitArea.on('pointerover', () => {
                emoji.setScale(1.1);
                name.setStyle({ color: '#ffffff' });
            });

            hitArea.on('pointerout', () => {
                emoji.setScale(1);
                name.setStyle({ color: '#ffd700' });
            });

            // Handle character selection
            hitArea.on('pointerdown', () => {
                const player = new Player(char.class);
                this.scene.start('DungeonScene', { player, currentRoom: 0 });
            });
        });
    }
}
