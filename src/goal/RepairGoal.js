let RepairTask = require('task_RepairTask');


const TICS_REPAIR_THRESHOLD = 0.75;

    

const findStructuresNeedingRepair = (room) => {
    return room.find(FIND_STRUCTURES, {
        filter: (s) => {
            // repair once a structure hits drop below 85% max
            return (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) && ((s.hits / s.hitsMax) < TICS_REPAIR_THRESHOLD);
        }
    });
}


const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    };


    analyze(room, taskTable) {
        
        let pendingTasks = taskTable.getByType(RepairTask.TYPE);
        for (let i=0; i < pendingTasks.length; i++) {
            let task = pendingTasks[i];
            let structure = Game.getObjectById(task.targetId);
            // if a structure was fully repaired, terminate the task
            // otherwise keep the task pending
            if (structure == null || structure.hits == structure.hitsMax) {
                taskTable.terminate(task.id);
            }
        }

        let structures = findStructuresNeedingRepair(room);
        for (let i=0; i < structures.length; i++) {
            let structure = structures[i];
            let key = RepairTask.TYPE + '-' + structure.id;
            if (!taskTable.exists(key)) {
                taskTable.addTask({
                    id: key,
                    type: RepairTask.TYPE,
                    goal: this.goalId,
                    targetId: structure.id,
                    score: 10,
                    minWorkers: 1,
                    maxWorkers: 3,
                    assignedWorkers: {}
                });
            }
        }
    }
}

module.exports = Goal;
