# Dicey Dungeons v2

A roguelike dungeon crawler where your fate lies in the roll of the dice! Built with Phaser 3, TypeScript, and Vite.

![preview.jpg](preview.jpg)

## About the Game

Dicey Dungeons v2 is a turn-based dungeon crawler where you use dice mechanics to battle monsters, find treasure, and survive increasingly difficult encounters. Choose your character class, manage your resources, and make tactical decisions about dice placement to emerge victorious!

### Game Features

- **Dice-Based Combat System**: Roll and strategically use dice for attacks, defense, magic, and healing
- **Multiple Character Classes**: Choose between different classes like Knight and Mage, each with unique abilities
- **Resource Management**: Balance your HP (Health Points) and MP (Magic Points) throughout your dungeon run
- **Progressive Difficulty**: Face increasingly challenging monsters as you venture deeper into the dungeon
- **Item System**: Equip weapons and armor to enhance your abilities, and use consumable items for tactical advantage

## Project Structure

```
src/
├── game/           # Core game logic
│   ├── DiceManager.ts    # Dice rolling and management
│   ├── Monster.ts       # Monster class and behavior
│   └── Player.ts        # Player stats and actions
├── scenes/         # Game scenes
│   ├── BattleScene.ts   # Combat encounters
│   ├── DungeonScene.ts  # Dungeon exploration
│   └── MainMenuScene.ts # Main menu
└── types/          # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone [your-repo-url]

# Install dependencies
npm install
# or
pnpm install
```

### Development

```bash
# Start development server
npm run dev
# or
pnpm dev
```

### Building for Production

```bash
# Build the project
npm run build
# or
pnpm build

# Preview the build
npm run preview
# or
pnpm preview
```

## Game Mechanics

### Combat System
- Roll dice each turn
- Lock dice to save them for future combinations
- Combine dice of the same type for powerful effects:
  - ⚔️ Attack dice: Deal damage to enemies
  - 🛡️ Defense dice: Reduce incoming damage
  - ✨ Magic dice: Cast spells (requires MP)
  - 💝 Health dice: Restore HP

### Progression
- Defeat monsters to earn experience and gold
- Find and equip better items to increase your power
- Manage your resources between battles
- Choose your path through the dungeon

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
