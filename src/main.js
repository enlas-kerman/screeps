
module.exports.loop = () => {
    
    let mara = Game.spawns['MARA'];

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        let sources = creep.room.find(FIND_SOURCES);
        if (creep.store.getFreeCapacity() > 0 && creep.harvest(sources[0]) != ERR_NOT_IN_RANGE) {

        } else {
            if (creep.store.getFreeCapacity() == creep.store.getCapacity()) {
                creep.moveTo(sources[0]);
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