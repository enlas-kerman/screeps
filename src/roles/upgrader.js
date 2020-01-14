
const ROLE = 'upgrader v1';
const UPGRADER_CONFIG = [WORK, CARRY, MOVE];

const ST_INIT = 0;
const ST_HARVESTING = 1;
const ST_UPGRADING = 2;
const ST_REFUELING_SPAWN = 3;
const ST_REFUELING_TOWER = 4;

const SPAWN_REFUELING_THRESHOLD = 0.5;


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

    ROLE: ROLE,

    Upgrader: function(creep) {

        const doStateInit = () => {
            creep.memory.state = ST_HARVESTING;
        }

        // figure out the best location to deliver energy
        const deliver = () => {
            let mara = Game.spawns['MARA'];
            if (mara.energy < (mara.energyCapacity * SPAWN_REFUELING_THRESHOLD)) {
                creep.memory.state = ST_REFUELING_SPAWN;
            } else {
                creep.memory.state = ST_UPGRADING;
            }
        }


        const doStateHarvesting = (ruins) => {
            if (creep.store.getFreeCapacity() == 0) {
                deliver();
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


        const doStateUpgrading = () => {
            if (creep.store.getUsedCapacity() == 0) {
                creep.memory.state = ST_HARVESTING;
            } else {
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller);
                }
            }
        }


        const doStateRefuelingSpawn = () => {
            if (creep.store.getUsedCapacity() == 0) {
                creep.memory.state = ST_HARVESTING;
            } else {
                let mara = Game.spawns['MARA'];
                if (mara.energy >= (mara.energyCapacity * SPAWN_REFUELING_THRESHOLD)) {
                    // spawn no longer needs help, so unload somewhere else
                    deliver();
                } else {
                    if (creep.transfer(mara, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(mara);
                    }
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
                    case ST_UPGRADING:
                        return doStateUpgrading();
                    case ST_REFUELING_SPAWN:
                        return doStateRefuelingSpawn();
                    case ST_REFUELING_TOWER:
                        return doStateRefuelingTower();
                    default:
                }

            }
        }
    },


    spawnUpgrader: function(spawn) {
        let index = Memory.lastUpgraderIndex++;
        spawn.spawnCreep(UPGRADER_CONFIG, 'H' + index, {
            memory: {
                role: ROLE
            }
        });
    }

};

