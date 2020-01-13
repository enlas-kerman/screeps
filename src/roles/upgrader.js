

function findNearestRuin(ruins, creep) {
    let minCost = 1000000;
    let minCostRuin = null;
    ruins.forEach((ruin) => {
        if (ruin.store.getUsedCapacity() > 0) {
            let path = PathFinder.search(creep.pos, ruin);
            if (path.cost <= minCost) {
                minCost = path.cost;
                minCostRuin = ruin;
            }
        }
    });
    return minCostRuin;
}



module.exports.Upgrader = function(creep) {

    return {
        update: function(mara, ruins) {

            let nearestRuin = findNearestRuin(ruins, creep);
            if (creep.store.getFreeCapacity() > 0 && creep.withdraw(nearestRuin, RESOURCE_ENERGY, creep.store.getFreeCapacity()) != ERR_NOT_IN_RANGE) {
                let amount = Math.min(creep.store.getFreeCapacity(), nearestRuin.store.getUsedCapacity());
                let err = creep.withdraw(nearestRuin, RESOURCE_ENERGY, amount);
                if (err != OK && err != ERR_NOT_IN_RANGE) {
                    console.log('creep[' + creep.name + '] error withdrawing: ' + err);
                }
            } else {
                if (creep.store.getFreeCapacity() == creep.store.getCapacity()) {
                    creep.moveTo(nearestRuin);
                } else {
    
                    if (mara.energy < mara.energyCapacity) {
                        if (creep.transfer(mara, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(mara);
                        }
                    } else {
                        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.controller);
                        }
                    }
    
                }
    
            }           

        }
    }

};