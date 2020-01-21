

const findBestEnergySource = (room, worker) => {

    let creep = worker.getCreep();

    if (worker.getTaskData().useContainer) {
        let containers = room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity());
            }
        });

        if (containers.length > 0) {
            return containers[0];
        }
    }


    let costs = new PathFinder.CostMatrix;
    room.find(FIND_CREEPS).forEach((creep) => {
        costs.set(creep.pos.x, creep.pos.y, 0xff);
    });

    let minCost = 1000000;
    let minCostSource = null;
    room.find(FIND_SOURCES).forEach((source) => {
        let ret = PathFinder.search(creep.pos, [{ pos: source.pos, range: 1}], {
            plainCost: 1,
            swampCost: 5,
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

/**
 * return true if the worker has completed collection
 */
const doCollectEnergy = (worker) => {
    let creep = worker.getCreep();
    let data = worker.getTaskData();
    if (creep.store.getFreeCapacity() > 0) {
        let source = findBestEnergySource(creep.room, worker);
        if (source) {
            if (source.structureType) {
                if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            } else {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                } else {
                    data.useContainer = false;
                }
            }
        }
        return false;
    } else {
        return true;
        //data.state = ST_UPGRADE;
    }
}


const resetEnergyAffinity = (worker) => {
    worker.getTaskData().useContainer = true;
}


module.exports = {
    doCollectEnergy: doCollectEnergy,
    resetEnergyAffinity: resetEnergyAffinity
}
