const TICS_REPAIR_THRESHOLD = 0.90;

Memory.rooms = Memory.rooms || {};


module.exports = class {


    constructor(roomName) {
        this.room = Game.rooms[roomName];
        Memory.rooms[roomName] = Memory.rooms[roomName] || {};
        this.memory = Memory.rooms[roomName];
    }


    findTowers() {
        return this.room.find(FIND_MY_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_TOWER
            }
        });
    }


    findStructuresNeedingRepair() {
        return this.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                // repair once a structure hits drop below 85% max
                return (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) && ((s.hits / s.hitsMax) < TICS_REPAIR_THRESHOLD);
            }
        });
    }        


    defend(towers) {
        let hostiles = this.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            towers.forEach((tower) => {
                tower.attack(hostiles[0]);
            });
            return true;
        }
        return false;
    }


    repair(towers) {
        let repairTarget;
        if (this.memory.currentRepairTargetId) {
            let target = Game.getObjectById(this.memory.currentRepairTargetId);
            if (!target || target.hits >= target.hitsMax) {
                this.memory.currentRepairTargetId = null;
            } else {
                repairTarget = target;
            }
        } else {
            let structures = this.findStructuresNeedingRepair(this.room);
            if (structures.length > 0) {
                repairTarget = structures[0];
            }
        }

        if (repairTarget) {
            this.memory.currentRepairTargetId = repairTarget.id;
            towers.forEach((tower) => {
                if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > tower.store.getCapacity(RESOURCE_ENERGY) * 0.30) {
                    tower.repair(repairTarget);
                }
            });
        }
    }


    update() {
        let towers = this.findTowers(this.room);
        console.log('Towers: ' + towers.length);
        if (!this.defend(towers)) {
            console.log('repairing');
            this.repair(towers);
        }
    }

}