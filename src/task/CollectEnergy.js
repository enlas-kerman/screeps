

const MAX_PATH_COST = 25;

const findCheapestPath = (worker, targets) => {
    let creep = worker.getCreep();
    let lowestCost = 10000000;
    let lowestCostTarget = null;
    targets.forEach((target) => {
        const ret = PathFinder.search(creep.pos, target.pos, {
            plainCost: 1,
            swampCost: 5
        });
        if (ret.cost < lowestCost) {
            lowestCost = ret.cost;
            lowestCostTarget = target;
        }
    });
    if (lowestCostTarget) {
        return {
            target: lowestCostTarget,
            cost: lowestCost
        }
    }
}


const findBestEnergySource = (room, worker) => {

    let creep = worker.getCreep();

    // tombstones first
    let tombstones = room.find(FIND_TOMBSTONES, {
        filter: (tombstone) => {
            return tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    if (tombstones.length > 0) {
        let cheapest = findCheapestPath(worker, tombstones);
        if (cheapest && cheapest.cost < MAX_PATH_COST) {
            return cheapest.target;
        }
    }


    // dropped resources
    let resources = room.find(FIND_DROPPED_RESOURCES, {
        filter: (resource) => {
            return resource.resourceType == RESOURCE_ENERGY && resource.amount > 0;
        }
    });
    if (resources.length > 0) {
        let cheapest = findCheapestPath(worker, resources);
        if (cheapest && cheapest.cost < MAX_PATH_COST) {
            return cheapest.target;
        }
    }


    // containers next
    let containers = room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity());
        }
    });
    if (containers.length > 0) {
        let cheapest = findCheapestPath(worker, containers);
        if (cheapest) {
            return cheapest.target;
        }
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
                                let err = creep.moveTo(target);
                                if (err == ERR_NO_PATH) {
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
