

module.exports = {


    Towers: function(game, memory) {

        const findTowers = (room) => {
            return room.find(FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_TOWER
                }
            });
        };

        return {
            update: function() {
                let rooms = game.rooms;
                for (let name in rooms) {
                    let room = rooms[name];
                    if (room.controller.my) {
                        let hostiles = room.find(FIND_HOSTILE_CREEPS);
                        if (hostiles.length > 0) {
                            let towers = findTowers(room);
                            towers.forEach((tower) => {
                                tower.attack(hostiles[0]);
                            });
                        }
                    }
                }
            }
        }
    }

}