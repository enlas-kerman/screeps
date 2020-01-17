
const ROLE = 'builder';
const BUILDER_CONFIG = [WORK, WORK, CARRY, MOVE, MOVE];

const ST_INIT = 0;
const ST_HARVESTING = 1;
const ST_BUILDING = 2;
const ST_REPAIRING = 3;

const ROADS_TICS_REPAIR_THRESHOLD = 0.85;


if (typeof Memory.lastBuilderIndex === 'undefined') {
    Memory.lastBuilderIndex = 0;
}


const findBestSource = (room, creep) => {

    let costs = new PathFinder.CostMatrix;
    room.find(FIND_CREEPS).forEach((creep) => {
        costs.set(creep.pos.x, creep.pos.y, 0xff);
    });

    let minCost = 1000000;
    let minCostSource = null;
    room.find(FIND_SOURCES).forEach((source) => {
        let ret = PathFinder.search(creep.pos, [{ pos: source.pos, range: 1}], {
            plainCost: 2,
            swampCost: 10,
            roomCallback: () => {
                return costs;
            }
        });
        if (!ret.incomplete && ret.cost <= minCost) {
            minCost = ret.cost;
            minCostSource = source;
        }
    });

    return minCostSource;
};


module.exports = {

    ROLE_BUILDER: ROLE,

    Builder: function(creep) {

        const findRoadsNeedingRepair = (room) => {
            return room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    // repair once a roads hits drop below 85% max
                    return (s.structureType == STRUCTURE_ROAD) && ((s.hits / s.hitsMax) < ROADS_TICS_REPAIR_THRESHOLD);
                }
            });
        }


        const beginDelivery = (room) => {
            let roads = findRoadsNeedingRepair(room);
            if (roads.length > 0) {
                creep.memory.state = ST_REPAIRING;
                let road = roads[Math.floor(Math.random() * roads.length)];
                creep.memory.targetId = road.id;
                return;
            }

            let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            if (sites.length > 0) {
                creep.memory.state = ST_BUILDING;
                creep.memory.targetId = sites[0].id;
                return;
            }

            // if nobody to delivery energy to, go fill up on energy
            creep.memory.state = ST_HARVESTING;
        }


        const doStateInit = () => {
            creep.memory.state = ST_HARVESTING;
        }


        const doStateHarvesting = () => {
            if (creep.store.getFreeCapacity() > 0) {
                let source = findBestSource(creep.room, creep);
                if (source) {
                    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                } else {
                    console.log('Builder unable to move because no source found.');
                }
            } else {
                beginDelivery(creep.room);
            }
        }


        const doStateBuilding = () => {
            let room = creep.room;
            if (creep.store.getUsedCapacity() == 0) {
                creep.memory.state = ST_HARVESTING;
                return;
            }

            if (!creep.memory.targetId) {
                beginDelivery(room);
                return;
            }

            let site = Game.getObjectById(creep.memory.targetId);

            if (!site) {
                beginDelivery(room);
                return;
            }

            if (creep.build(site) == ERR_NOT_IN_RANGE) {
                creep.moveTo(site);
            }

        }


        const doStateRepairing = () => {
            if (false || creep.store.getUsedCapacity() == 0) {
                creep.memory.state = ST_HARVESTING;
                return;
            }

            let room = creep.room;
            if (!creep.memory.targetId) {
                beginDelivery(room);
                return;
            }
            let structure = Game.getObjectById(creep.memory.targetId);
            if (!structure) {
                beginDelivery(room);
                return;
            }

            if (structure.hits < structure.hitsMax) {
                if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            } else {
                beginDelivery(room);
            }
        }


        return {

            update: function() {

                switch(creep.memory.state) {
                    case ST_INIT:
                        doStateInit();
                        break;
                    case ST_HARVESTING:
                        doStateHarvesting();
                        break;
                    case ST_BUILDING:
                        doStateBuilding();
                        break;
                    case ST_REPAIRING:
                        doStateRepairing();
                        break;
                }

            }
        }
    },


    spawnBuilder: (spawn) => {
        let err = spawn.spawnCreep(BUILDER_CONFIG, 'B' + Memory.lastBuilderIndex, {
            memory: {
                role: ROLE,
                state: ST_INIT
            }
        });
        if (err == OK) {
            Memory.lastBuilderIndex++;
        }
    }

}
