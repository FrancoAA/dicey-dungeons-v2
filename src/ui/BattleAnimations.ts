import Phaser from 'phaser';

export class BattleAnimations {
    constructor(private scene: Phaser.Scene) {}

    public async animateAttack(attacker: Phaser.GameObjects.Text, target: Phaser.GameObjects.Text): Promise<void> {
        const originalX = attacker.x;
        const direction = attacker.x < target.x ? 1 : -1;
        
        return new Promise<void>(resolve => {
            this.scene.tweens.add({
                targets: attacker,
                x: attacker.x + (50 * direction),
                duration: 100,
                ease: 'Power1',
                yoyo: true,
                onComplete: () => {
                    attacker.x = originalX;
                    resolve();
                }
            });
        });
    }

    public async animateDamage(target: Phaser.GameObjects.Text): Promise<void> {
        const originalTint = target.style.color;
        target.setStyle({ color: '#ff0000' });
        
        return new Promise<void>(resolve => {
            this.scene.tweens.add({
                targets: target,
                x: target.x + 10,
                duration: 50,
                ease: 'Power1',
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    target.setStyle({ color: originalTint });
                    resolve();
                }
            });
        });
    }

    public async animateHealing(target: Phaser.GameObjects.Text): Promise<void> {
        const particles = this.scene.add.particles(target.x, target.y, '✨', {
            speed: 100,
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            gravityY: -100,
            quantity: 1,
            frequency: 100,
            duration: 800
        });

        return new Promise<void>(resolve => {
            this.scene.time.delayedCall(800, () => {
                particles.destroy();
                resolve();
            });
        });
    }

    public async animateMagic(target: Phaser.GameObjects.Text): Promise<void> {
        const circle = this.scene.add.circle(target.x, target.y, 40, 0x4444ff, 0.3);
        circle.setAlpha(0);

        return new Promise<void>(resolve => {
            this.scene.tweens.add({
                targets: circle,
                alpha: 0.5,
                scale: 1.5,
                duration: 500,
                ease: 'Power2',
                yoyo: true,
                onComplete: () => {
                    circle.destroy();
                    resolve();
                }
            });
        });
    }

    public async showDamageNumber(target: Phaser.GameObjects.Text, amount: number, type: 'physical' | 'magic'): Promise<void> {
        const damageText = this.scene.add.text(target.x, target.y - 20, `-${amount}`, {
            font: '24px Arial',
            color: type === 'physical' ? '#ff0000' : '#4444ff'
        }).setOrigin(0.5);

        return new Promise<void>(resolve => {
            this.scene.tweens.add({
                targets: damageText,
                y: damageText.y - 30,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    damageText.destroy();
                    resolve();
                }
            });
        });
    }

    public async showHealNumber(target: Phaser.GameObjects.Text, amount: number): Promise<void> {
        const healText = this.scene.add.text(target.x, target.y - 20, `+${amount}`, {
            font: '24px Arial',
            color: '#00ff00'
        }).setOrigin(0.5);

        return new Promise<void>(resolve => {
            this.scene.tweens.add({
                targets: healText,
                y: healText.y - 30,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    healText.destroy();
                    resolve();
                }
            });
        });
    }
}
