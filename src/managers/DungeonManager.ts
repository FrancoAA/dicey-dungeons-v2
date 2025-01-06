import { RoomType } from '../types/GameTypes';

export class DungeonManager {
    private dungeonLength = 10;

    public generateDungeon(): RoomType[] {
        const rooms: RoomType[] = [];
        let hasEncounter = false;

        // Fill all rooms except last two (merchant and boss)
        for (let i = 0; i < this.dungeonLength - 2; i++) {
            const lastRoom = rooms[rooms.length - 1];
            const roll = Math.random() * 100;

            // If we haven't added an encounter room and we're at least halfway through
            if (!hasEncounter && i >= this.dungeonLength / 2 && i < this.dungeonLength - 3) {
                rooms.push(RoomType.ENCOUNTER);
                hasEncounter = true;
                continue;
            }

            // If last room was a chest or merchant, force a monster room
            if (lastRoom === RoomType.CHEST || lastRoom === RoomType.MERCHANT) {
                rooms.push(RoomType.MONSTER);
                continue;
            }

            // Adjust probabilities based on previous room
            if (roll < 35) {  // Chest room (35% chance)
                rooms.push(RoomType.CHEST);
            } else if (roll < 85) {  // Monster room (50% chance)
                rooms.push(RoomType.MONSTER);
            } else {  // Merchant room (15% chance)
                rooms.push(RoomType.MERCHANT);
            }
        }

        // Add merchant room before boss
        rooms.push(RoomType.MERCHANT);

        // Add boss room at the end
        rooms.push(RoomType.BOSS);

        return rooms;
    }

    public getRoomInfo(roomType: RoomType): { 
        title: string; 
        emoji: string; 
        description: string 
    } {
        switch (roomType) {
            case RoomType.MONSTER:
                return {
                    title: 'Monster Room',
                    emoji: '👾',
                    description: 'A fearsome monster blocks your path!'
                };
            case RoomType.CHEST:
                return {
                    title: 'Treasure Room',
                    emoji: '💎',
                    description: 'You found a treasure chest!'
                };
            case RoomType.MERCHANT:
                return {
                    title: 'Merchant Room',
                    emoji: '🏪',
                    description: 'A friendly merchant offers their wares.'
                };
            case RoomType.BOSS:
                return {
                    title: 'Boss Room',
                    emoji: '👑',
                    description: 'The dungeon boss awaits...'
                };
            case RoomType.ENCOUNTER:
                return {
                    title: 'Mysterious Room',
                    emoji: '❓',
                    description: 'A strange situation presents itself...'
                };
        }
    }
}
