
const ROLE = 'upgrader v1';
const UPGRADER_CONFIG = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];

const ST_INIT = 0;
const ST_HARVESTING = 1;
const ST_DELIVERING = 5;

const SPAWN_REFUELING_THRESHOLD = 1.0;


if (typeof Memory.lastUpgraderIndex === 'undefined') {
    Memory.lastUpgraderIndex = 0;
}

function findNearestRuin(ruins, creep) {
    let minCost = 1000000;
    let minCostRuin = null;
    ruins.forEach((ruin) => {
        let path = PathFinder.search(creep.pos, ruin);
        if (path.cost <= minCost) {
            minCost = path.cost;
            minCostRuin = ruin;
        }
    });
    return minCostRuin;
}


module.exports = {

    ROLE_UPGRADER: ROLE,

    Upgrader: function(creep) {

        const doStateInit = () => {
            creep.memory.state = ST_HARVESTING;
        }


        const findBestTarget = () => {

            // keep the controller fed
            if (creep.room.controller.ticksToDowngrade < 10000) {
                return creep.room.controller;
            }

            let towers = creep.room.find(FIND_MY_STRUCTURES).filter((struct) => {
                return struct.structureType == STRUCTURE_TOWER && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });
            if (towers.length > 0) {
                return towers[0];
            }

            // extensions get filled before spawn, b/c spawn can regen on its own if necessary
            let exts = creep.room.find(FIND_MY_STRUCTURES).filter((struct) => {
                return struct.structureType == STRUCTURE_EXTENSION && struct.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            });
            if (exts.length > 0) {
                return exts[Math.floor(Math.random() * exts.length)];
            }

            let mara = Game.spawns['MARA'];
            if (mara.energy < (mara.energyCapacity * SPAWN_REFUELING_THRESHOLD)) {
                return mara;
            }

            // if nobody else needs energy, upgrade the controller
            return creep.room.controller;
        }

        
        // figure out the best location to deliver energy
        const beginDelivery = () => {
            let target = findBestTarget();
            if (target) {
                creep.memory.state = ST_DELIVERING;
                creep.memory.targetId = target.id;
            } else {
                creep.memory.state = ST_HARVESTING;
            }
            return;
        }


        const doStateHarvesting = (ruins) => {
            if (creep.store.getFreeCapacity() == 0) {
                beginDelivery();
            } else {
                let nearestRuin = findNearestRuin(ruins, creep);
                if (creep.withdraw(nearestRuin, RESOURCE_ENERGY, creep.store.getFreeCapacity()) != ERR_NOT_IN_RANGE) {
                    let amount = Math.min(creep.store.getFreeCapacity(), nearestRuin.store.getUsedCapacity());
                    creep.withdraw(nearestRuin, RESOURCE_ENERGY, amount);
                } else {
                    creep.moveTo(nearestRuin);
                }
            }
        }


        const deliver = (dest) => {
            switch(dest.structureType) {
                case STRUCTURE_CONTROLLER:
                    return creep.upgradeController(dest);
                case STRUCTURE_SPAWN:
                case STRUCTURE_TOWER:
                case STRUCTURE_EXTENSION:
                    return creep.transfer(dest, RESOURCE_ENERGY);
                default:
                    console.log('Unknown structure ' + dest.structureType);
            }
        }


        const doStateDelivering = () => {
            if (creep.store.getUsedCapacity() == 0) {
                creep.memory.state = ST_HARVESTING;
            } else {
                let targetId = creep.memory.targetId;
                if (targetId) {
                    let dest = Game.getObjectById(targetId);
                    if (dest) {
                        if (dest.store && dest.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                            beginDelivery();
                        } else {
                            let err = deliver(dest);
                            if (err == ERR_NOT_IN_RANGE) {
                                creep.moveTo(dest);
                            } else {
                                // console.log('err: ' + err);
                            }
                        }
                    } else {
                        beginDelivery();
                    }
                } else {
                    beginDelivery();
                }
            }
        }


        return {
            update: function(mara, ruins) {

                switch(creep.memory.state) {
                    case ST_INIT:
                        return doStateInit();
                    case ST_HARVESTING:
                        return doStateHarvesting(ruins);
                    case ST_DELIVERING:
                        return doStateDelivering();
                    default:
                        creep.memory.state = ST_INIT;
                }

            }
        }
    },


    spawnUpgrader: function(spawn) {
        let err = spawn.spawnCreep(UPGRADER_CONFIG, 'H' + Memory.lastUpgraderIndex, {
            memory: {
                role: ROLE,
                state: ST_INIT
            }
        });
        if (err == OK) {
            Memory.lastUpgraderIndex++;
        }
    }

};

