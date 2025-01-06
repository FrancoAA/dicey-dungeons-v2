import Phaser from 'phaser';
import Player from '../game/Player';

export class StatusBar {
    private levelText: Phaser.GameObjects.Text;
    private goldText: Phaser.GameObjects.Text;
    private roomText: Phaser.GameObjects.Text;

    constructor(
        private scene: Phaser.Scene,
        private player: Player,
        private currentRoom: number
    ) {
        this.createStatusBar();
    }

    private createStatusBar(): void {
        const width = this.scene.scale.width;
        const statusBarHeight = 40;

        // Create status bar background
        const statusBar = this.scene.add.rectangle(0, 0, width, statusBarHeight, 0x000000);
        statusBar.setOrigin(0, 0);
        statusBar.setAlpha(0.8);

        // Add status texts
        this.levelText = this.scene.add.text(20, statusBarHeight / 2, `📊 Level ${this.player.level}`, {
            font: '20px Arial',
            color: '#ffffff'
        }).setOrigin(0, 0.5);

        this.goldText = this.scene.add.text(width / 2, statusBarHeight / 2, `💰 ${this.player.gold} Gold`, {
            font: '20px Arial',
            color: '#ffd700'
        }).setOrigin(0.5, 0.5);

        this.roomText = this.scene.add.text(width - 20, statusBarHeight / 2, `Room: ${this.currentRoom + 1}/10`, {
            font: '20px Arial',
            color: '#ffffff'
        }).setOrigin(1, 0.5);
    }

    public update(): void {
        this.levelText.setText(`📊 Level ${this.player.level}`);
        this.goldText.setText(`💰 ${this.player.gold} Gold`);
        this.roomText.setText(`Room: ${this.currentRoom + 1}/10`);
    }
}
