
const TICS_REPAIR_THRESHOLD = 0.90;

module.exports = {


    Towers: function(game, memory) {

        const findTowers = (room) => {
            return room.find(FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_TOWER
                }
            });
        };


        const findStructuresNeedingRepair = (room) => {
            return room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    // repair once a structure hits drop below 85% max
                    return (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) && ((s.hits / s.hitsMax) < TICS_REPAIR_THRESHOLD);
                }
            });
        }        


        const defend = (room, towers) => {
            let hostiles = room.find(FIND_HOSTILE_CREEPS);
            if (hostiles.length > 0) {
                towers.forEach((tower) => {
                    tower.attack(hostiles[0]);
                });
                return true;
            }
            return false;
        }


        const repair = (room, towers) => {
            let repairTarget;
            if (Memory.currentTowerRepairTargetId) {
                let target = Game.getObjectById(Memory.currentTowerRepairTargetId);
                if (!target || target.hits >= target.hitsMax) {
                    delete Memory.currentTowerRepairTargetId;
                } else {
                    repairTarget = target;
                }
            } else {
                let structures = findStructuresNeedingRepair(room);
                if (structures.length > 0) {
                    repairTarget = structures[0];
                }
            }

            if (repairTarget) {
                Memory.currentTowerRepairTargetId = repairTarget.id;
                towers.forEach((tower) => {
                    if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > tower.store.getCapacity(RESOURCE_ENERGY) * 0.30) {
                        tower.repair(repairTarget);
                    }
                });
            }
        }


        return {

            update: function() {
                let rooms = game.rooms;
                for (let name in rooms) {
                    let room = rooms[name];
                    if (room.controller.my) {
                        let towers = findTowers(room);
                        if (!defend(room, towers)) {
                            repair(room, towers);
                        }
                    }
                }
            }
        }
    }

}