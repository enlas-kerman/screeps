
const ROLE = 'builder';
const BUILDER_CONFIG = [WORK, CARRY, MOVE];

const ST_INIT = 0;
const ST_HARVESTING = 1;
const ST_BUILDING = 2;


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
                creep.memory.state = ST_BUILDING;
            }
        }

        const doStateBuilding = () => {
            let room = creep.room;
            let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            if (creep.store.getUsedCapacity() > 0) {
                if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sites[0]);
                }
            } else {
                creep.memory.state = ST_HARVESTING;
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
