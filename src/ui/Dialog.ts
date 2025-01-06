import Phaser from 'phaser';

export interface DialogConfig {
    title: string;
    content: string;
    buttonText: string;
    onClose: () => void;
}

export class Dialog {
    private elements: Phaser.GameObjects.GameObject[] = [];

    constructor(
        private scene: Phaser.Scene,
        private config: DialogConfig
    ) {
        this.createDialog();
    }

    private createDialog(): void {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const dialogWidth = 400;
        const dialogHeight = 300;

        // Create overlay
        const overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0);
        this.elements.push(overlay);

        // Create dialog background and border
        const dialog = this.scene.add.rectangle(
            width / 2,
            height / 2,
            dialogWidth,
            dialogHeight,
            0x333333,
            1
        ).setOrigin(0.5);
        this.elements.push(dialog);

        const border = this.scene.add.rectangle(
            width / 2,
            height / 2,
            dialogWidth + 4,
            dialogHeight + 4,
            0xffffff,
            1
        ).setOrigin(0.5).setDepth(-1);
        this.elements.push(border);

        // Add title
        const titleText = this.scene.add.text(width / 2, height / 2 - 100, this.config.title, {
            font: 'bold 36px Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.elements.push(titleText);

        // Add content
        const contentText = this.scene.add.text(width / 2, height / 2, this.config.content, {
            font: '24px Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.elements.push(contentText);

        // Add button
        const button = this.scene.add.rectangle(
            width / 2,
            height / 2 + 80,
            200,
            40,
            0x4a90e2
        ).setOrigin(0.5);
        this.elements.push(button);

        const buttonText = this.scene.add.text(width / 2, height / 2 + 80, this.config.buttonText, {
            font: 'bold 20px Arial',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.elements.push(buttonText);

        button.setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.setFillStyle(0x357abd))
            .on('pointerout', () => button.setFillStyle(0x4a90e2))
            .on('pointerdown', () => {
                this.destroy();
                this.config.onClose();
            });
    }

    private destroy(): void {
        this.elements.forEach(element => element.destroy());
    }
}
