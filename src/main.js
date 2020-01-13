let UpgraderRole = require('roles_upgrader');


let MAX_UPGRADERS = 5;
let UPGRADER_CONFIG = [WORK, CARRY, MOVE];


module.exports.loop = () => {
    
    let mara = Game.spawns['MARA'];
    let ruins = mara.room.find(FIND_RUINS);

    let numberOfCreeps = Object.keys(Game.creeps).length;
    if (numberOfCreeps < MAX_UPGRADERS) {
        if (mara.isActive() && mara.spawning == null) {
            if (typeof Memory.lastUpgraderIndex === 'undefined') {
                Memory.lastUpgraderIndex = 5;
            }
            Memory.lastUpgraderIndex++;
            mara.spawnCreep(UPGRADER_CONFIG, 'H' + Memory.lastUpgraderIndex);
        }
    }

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        let upgrader = new UpgraderRole.Upgrader(creep);
        upgrader.update(mara, ruins);
    }
    
}