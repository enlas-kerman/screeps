let UpgraderRole = require('roles_upgrader');
let BuilderRole = require('roles_builder');


let MAX_UPGRADERS = 8;
let MAX_BUILDERS = 2;


function getCreeps (gameCreeps) {
    let creeps = {
        upgraders: [],
        builders: []
    };
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        if (creep.memory.role === BuilderRole.ROLE) {
            creeps.builders.push(new BuilderRole.Builder(creep));
        } else {
            creeps.upgraders.push(new UpgraderRole.Upgrader(creep));
        }
    }
    return creeps;
}


const getCreepRole = (creep) => {
    switch(creep.memory.role) {
        case BuilderRole.ROLE:
            return new BuilderRole.Builder(creep);
        case UpgraderRole.ROLE:
        default:
            return new UpgraderRole.Upgrader(creep);
    }
};


const cleanupDeadCreeps = () => {
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Cleaned up ' + name);
        }
    }
};


module.exports.loop = () => {
    
    let mara = Game.spawns['MARA'];
    let ruins = mara.room.find(FIND_RUINS);
    
    cleanupDeadCreeps();

    let upgraders = [];
    let builders = [];

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

    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        var role = getCreepRole(creep);
        role.update(mara, ruins);
    }
    
}