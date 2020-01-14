let UpgraderRole = require('roles_upgrader');
let BuilderRole = require('roles_builder');

let MAX_UPGRADERS = 8;
let MAX_BUILDERS = 5;


module.exports = {


    Controller: function(game, memory) {

        const cleanupDeadCreeps = () => {
            for (let name in memory.creeps) {
                if (!game.creeps[name]) {
                    delete memory.creeps[name];
                    console.log('Cleaned up ' + name);
                }
            }
        };
        

        const getCreeps = (gameCreeps) => {
            let creeps = {
                upgraders: [],
                builders: []
            };
            for (let name in gameCreeps) {
                let creep = gameCreeps[name];
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


        return {
            update: function() {
                cleanupDeadCreeps();

                let creeps = getCreeps(game.creeps);
                // console.log('Number of upgraders: ' + creeps.upgraders.length);
                // console.log('Number of builders: ' + creeps.builders.length);
            
                let mara = Game.spawns['MARA'];

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
            
                let ruins = mara.room.find(FIND_RUINS).filter(ruin => ruin.store.getUsedCapacity() > 0);
                creeps.upgraders.forEach((upgrader) => {
                    upgrader.update(mara, ruins);
                });
            
                creeps.builders.forEach((builder) => {
                    builder.update();
                });
            }
        }
    }


}