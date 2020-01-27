
const closestContainer = (worker, containers) => {
    let creep = worker.getCreep();
    let minRange = 1000000;
    let minContainer = null;
    for (var i=0; i < containers.length; i++) {
        let container = containers[i];
        let range = creep.pos.getRangeTo(container);
        if (range <= minRange) {
            minRange = range;
            minContainer = container;
        }
    }
    return minContainer;
}


const MAX_RANGE_FREE_ENERGY = 15;

const findBestEnergySource = (room, worker) => {

    let creep = worker.getCreep();

    // tombstones first
    let tombstones = room.find(FIND_TOMBSTONES, {
        filter: (tombstone) => {
            return creep.pos.getRangeTo(tombstone) < MAX_RANGE_FREE_ENERGY && tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    if (tombstones.length > 0) {
        return tombstones[0];
    }

    // dropped resources
    let resources = room.find(FIND_DROPPED_RESOURCES, {
        filter: (resource) => {
            return creep.pos.getRangeTo(resource) < MAX_RANGE_FREE_ENERGY && resource.resourceType == RESOURCE_ENERGY && resource.amount > 0;
        }
    });
    if (resources.length > 0) {
        return resources[0];
    }

    // containers next
    let containers = room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity());
        }
    });
    if (containers.length > 0) {
        return closestContainer(worker, containers);
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

                // target is a container or a tombstone
                if (target.store) {
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

                    if (target.amount) {
                        // target is a resource node
                        if (target.amount > 0) {
                            if (creep.pickup(target) == ERR_NOT_IN_RANGE) {
                                if (creep.moveTo(target) == ERR_NO_PATH) {
                                    data.noPathRetries++;
                                } else {
                                    data.noPathRetries = 0;
                                }
                            }
                        } else {
                            // resource is empty
                            data.targetId = null;
                        }
                    } else {
                        // target is a resource node
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
