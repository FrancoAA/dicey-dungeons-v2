import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import MainMenuScene from "./scenes/MainMenuScene";
import DungeonScene from "./scenes/DungeonScene";
import BattleScene from "./scenes/BattleScene";

const config: Phaser.Types.Core.GameConfig = {
    parent: "app",
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    scale: {
        mode: Phaser.Scale.ScaleModes.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [
        BootScene,
        MainMenuScene,
        DungeonScene,
        BattleScene
    ]
};

export default new Phaser.Game(config);