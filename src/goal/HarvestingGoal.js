
let HarvestingTask = require('task_HarvestingTask');


const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    }


    analyze(room, tasks) {
        let pendingTasks = tasks.getByType(HarvestingTask.TYPE, {
            filter: {
                goal: this.goalId
            }
        });
        for (let i=0; i < pendingTasks.length; i++) {
            let task = pendingTasks[i];
            let target = Game.getObjectById(task.targetId);
            if (target == null || target.store.getFreeCapacity() == 0) {
                tasks.terminate(task.id);
            }
        }

        let containers = this.findAvailableContainers(room);
        for (let i=0; i < containers.length; i++) {
            let container = containers[i];
            let key = HarvestingTask.TYPE + '-' + container.id;
            if (!tasks.exists(key) && (container.store.getFreeCapacity() > 600)) {
                tasks.addTask({
                    id: key,
                    type: HarvestingTask.TYPE,
                    goal: this.goalId,
                    targetId: container.id,
                    score: 97,
                    minWorkers: 1,
                    maxWorkers: 1,
                    assignedWorkers: {}
                });
            }
        }        
    }


    findAvailableContainers(room) {
        let sources = room.find(FIND_SOURCES);
        return room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.pos.findInRange(sources, 1).length > 0) &&
                    (s.structureType == STRUCTURE_CONTAINER) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
    }

}

module.exports = Goal;