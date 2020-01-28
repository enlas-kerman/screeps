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
            return true;
        }
        return false;
    }


    repairDefenses(towers) {
        let defensives = this.room.find(FIND_STRUCTURES, {
            filter: (s) => {
                // repair once a structure hits drop below 85% max
                return (s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART) && s.hits < 65000;
            }
        });
        if (defensives.length > 0) {
            let defensive = defensives[0];
            towers.forEach((tower) => {
                if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > tower.store.getCapacity(RESOURCE_ENERGY) * 0.60) {
                    tower.repair(defensive);
                }
            });
        }
    }


    heal(towers) {
        let wounded = this.room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
                return creep.hits < creep.hitsMax;
            }
        });
        if (wounded.length > 0) {
            towers.forEach((tower) => {
                tower.heal(wounded[0]);
            });
            return true;
        }
        return false;
    }


    update() {
        let towers = this.findTowers(this.room);
        if (!this.defend(towers)) {
            if (!this.heal(towers)) {
                if (!this.repair(towers)) {
                    this.repairDefenses(towers);
                }
            }
        }
    }

}