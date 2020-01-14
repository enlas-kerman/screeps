let UpgraderRole = require('roles_upgrader');
let BuilderRole = require('roles_builder');


let MAX_UPGRADERS = 8;
let MAX_BUILDERS = 5;


const cleanupDeadCreeps = () => {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Cleaned up ' + name);
        }
    }
};


function getCreeps (gameCreeps) {
    let creeps = {
        upgraders: [],
        builders: []
    };
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        switch(creep.memory.role) {
            case BuilderRole.ROLE:
                creeps.builders.push(new BuilderRole.Builder(creep));
                break;
            case UpgraderRole.ROLE:
            default:
                creeps.upgraders.push(new UpgraderRole.Upgrader(creep));
        }        
    }
    return creeps;
};


module.exports.loop = () => {
    
    let mara = Game.spawns['MARA'];
    let ruins = mara.room.find(FIND_RUINS).filter(ruin => ruin.store.getUsedCapacity() > 0);
    
    cleanupDeadCreeps();

    let creeps = getCreeps(Game.creeps);
    console.log('Number of upgraders: ' + creeps.upgraders.length);
    console.log('Number of builders: ' + creeps.builders.length);

    if (creeps.builders.length < MAX_BUILDERS) {
        if (mara.isActive() && mara.spawning == null) {
            BuilderRole.spawnBuilder(mara);
        }
    }

    if (creeps.upgraders.length < MAX_UPGRADERS) {
        if (mara.isActive() && mara.spawning == null) {
            UpgraderRole.spawnUpgrader(mara);
        }
    }

    creeps.upgraders.forEach((upgrader) => {
        upgrader.update(mara, ruins);
    });

    creeps.builders.forEach((builder) => {
        builder.update();
    });

    
}