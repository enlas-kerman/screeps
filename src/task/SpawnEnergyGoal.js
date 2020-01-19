/**
 * creates tasks when the spawn or extensions in the room are not full
 * when the targets are filled with energy, their corresponding tasks are removed
 */

let DeliverEnergyTask = require('task_DeliverEnergyTask');


const findSpawnsAndExtsNeedingEnergy = (room) => {
    return room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
}



module.exports = class {

    analyze(room, tasks) {

        let pendingTasks = tasks.getByType(DeliverEnergyTask.TYPE, {
            filter: {
                goal: 'SpawnEnergyGoal'
            }
        });
        for (let i=0; i < pendingTasks.length; i++) {
            let task = pendingTasks[i];
            let target = Game.getObjectById(task.targetId);
            if (target == null || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                tasks.terminate(task.id);
            }
        }

        let targets = findSpawnsAndExtsNeedingEnergy(room);
        for (let i=0; i < targets.length; i++) {
            let target = targets[i];
            let key = DeliverEnergyTask.TYPE + '-' + target.id;
            if (!tasks.exists(key)) {
                tasks.addTask({
                    id: key,
                    type: DeliverEnergyTask.TYPE,
                    goal: 'SpawnEnergyGoal',
                    targetId: target.id,
                    score: 10,
                    minWorkers: target.structureType === STRUCTURE_SPAWN ? 4 : 1,
                    maxWorkers: target.structureType === STRUCTURE_SPAWN ? 6 : 1,
                    assignedWorkers: {}
                });
            }
        }


    }

}