let DeliverEnergyTask = require('task_DeliverEnergyTask');


const findSpawnsAndExtsNeedingEnergy = (room) => {
    return room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return ((s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0))
                || ((s.structureType == STRUCTURE_TOWER) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > s.store.getCapacity(RESOURCE_ENERGY) * 0.50));
        }
    });
}



const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    }

    analyze(room, tasks) {

        let pendingTasks = tasks.getByType(DeliverEnergyTask.TYPE, {
            filter: {
                goal: this.goalId
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
                    goal: this.goalId,
                    targetId: target.id,
                    score: 15,
                    minWorkers: target.structureType === STRUCTURE_SPAWN ? 2 : 1,
                    maxWorkers: target.structureType === STRUCTURE_SPAWN ? 6 : 1,
                    assignedWorkers: {}
                });
            }
        }

    }

}

module.exports = Goal;