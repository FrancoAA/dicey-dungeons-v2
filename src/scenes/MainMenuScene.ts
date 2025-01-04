import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Title
        this.add.text(width / 2, height / 4, '🎲 Dungeon Dice 🎲', {
            font: 'bold 48px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Menu options
        const startButton = this.add.text(width / 2, height / 2, '⚔️ Start Game', {
            font: '32px Arial',
            color: '#ffffff'
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startButton.setStyle({ color: '#ff0' }))
            .on('pointerout', () => startButton.setStyle({ color: '#ffffff' }))
            .on('pointerdown', () => this.startGame());

        // Instructions
        this.add.text(width / 2, height * 0.8, 
            'Roll dice to fight monsters and explore dungeons!\n' +
            'Collect treasure and defeat the dungeon boss!', {
            font: '20px Arial',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
    }

    private startGame(): void {
        this.scene.start('DungeonScene', { continueGame: false });
    }
}
