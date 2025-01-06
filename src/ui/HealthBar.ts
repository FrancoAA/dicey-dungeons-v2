import Phaser from 'phaser';

export interface HealthBarConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    color: number;
    initialValue: number;
    maxValue: number;
    label?: string;
}

export class HealthBar {
    private background: Phaser.GameObjects.Rectangle;
    private bar: Phaser.GameObjects.Rectangle;
    public text: Phaser.GameObjects.Text;

    constructor(
        private scene: Phaser.Scene,
        private config: HealthBarConfig
    ) {
        this.createHealthBar();
    }

    private createHealthBar(): void {
        // Create background
        this.background = this.scene.add.rectangle(
            this.config.x - this.config.width/2,
            this.config.y,
            this.config.width,
            this.config.height,
            0x666666
        ).setOrigin(0, 0.5);

        // Create health bar
        this.bar = this.scene.add.rectangle(
            this.config.x - this.config.width/2,
            this.config.y,
            this.config.width,
            this.config.height,
            this.config.color
        ).setOrigin(0, 0.5);

        // Create text
        const label = this.config.label ? `${this.config.label} ` : '';
        this.text = this.scene.add.text(this.config.x, this.config.y, 
            `${label}${this.config.initialValue}/${this.config.maxValue}`, { 
            font: '16px Arial',
            color: '#000000'
        }).setOrigin(0.5);
    }

    public update(currentValue: number, maxValue: number): void {
        const percent = currentValue / maxValue;
        this.bar.setScale(percent, 1);
        
        const label = this.config.label ? `${this.config.label} ` : '';
        this.text.setText(`${label}${currentValue}/${maxValue}`);
    }
}
