

const findBestEnergySource = (room, worker) => {

    let creep = worker.getCreep();

    let containers = room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity());
        }
    });

    if (containers.length > 0) {
        return containers[0];
    }


    let costs = new PathFinder.CostMatrix;
    room.find(FIND_CREEPS).forEach((creep) => {
        costs.set(creep.pos.x, creep.pos.y, 0xff);
    });

    let minCost = 1000000;
    let minCostSource = null;
    room.find(FIND_SOURCES, {
        filter: (s) => {
            return s.energy > 0;
        }
    }).forEach((source) => {
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
    //console.log(worker.getId() + '--->' + minCost);
    return minCostSource;
};

/**
 * return true if the worker has completed collection
 * 
 * if !data.target 
 *     data.target = findBestEnergySource
 * else
 *     if (data.target is a source)
 *         if (data.target is empty)
 *             data.target = null
 *         else
 *             harvest/move
 *     else
 *         if (data.target is empty)
 *             data.target = null
 *         else
 *             withdraw/move
 * 
 */
const MAX_RETRIES = 5;

const doCollectEnergy = (worker) => {
    let creep = worker.getCreep();
    let data = worker.getTaskData();
    if (creep.store.getFreeCapacity() > 0) {

        if (data.targetId && data.noPathRetries < MAX_RETRIES) {
            let targetId = data.targetId;
            let target = Game.getObjectById(targetId);
            if (target) {
                if (target.structureType) {
                    if (target.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                        let err = creep.withdraw(target, RESOURCE_ENERGY);
                        if (err == ERR_NOT_IN_RANGE) {
                            if (creep.moveTo(target) == ERR_NO_PATH) {
                                data.noPathRetries++;
                            } else {
                                data.noPathRetries = 0;
                            }
                        } else {
                            if (err == ERR_NOT_ENOUGH_RESOURCES) {
                                data.targetId = null;
                            }
                        }
                    } else {
                        // container is empty
                        data.targetId = null;
                    }
                } else {
                    if (target.energy > 0) {
                        if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                            if (creep.moveTo(target) == ERR_NO_PATH) {
                                data.noPathRetries++;
                            } else {
                                data.noPathRetries = 0;
                            }
                        }
                    } else {
                        // source is empty
                        data.targetId = null;
                    }
                }
            } else {
                // target is gone
                data.targetId = null;
            }
        } else {
            data.targetId = null;
            data.noPathRetries = 0;
            let target = findBestEnergySource(creep.room, worker);
            if (target) {
                data.targetId = target.id;
            }
        }
        return false;
    }
    data.targetId = null;
    return true;
}


module.exports = {
    doCollectEnergy: doCollectEnergy
}
