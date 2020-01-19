/**
 * This goal attempts to maintain the roads within a room.
 * When roads fall below a threshold of hits, this goal
 * plans repair tasks to repair them.
 */

let RepairRoadTask = require('task_RepairRoadTask');


const ROADS_TICS_REPAIR_THRESHOLD = 0.75;

    

const findRoadsNeedingRepair = (room) => {
    return room.find(FIND_STRUCTURES, {
        filter: (s) => {
            // repair once a roads hits drop below 85% max
            return (s.structureType == STRUCTURE_ROAD) && ((s.hits / s.hitsMax) < ROADS_TICS_REPAIR_THRESHOLD);
        }
    });
}


module.exports = function(goalId) {

    return {
     
        analyze: function(room, taskTable) {
        
            let pendingTasks = taskTable.getByType(RepairRoadTask.TYPE);
            for (let i=0; i < pendingTasks.length; i++) {
                let task = pendingTasks[i];
                let road = Game.getObjectById(task.roadId);
                // if a road was fully repaired, terminate the task
                // otherwise keep the task pending
                if (road == null || road.hits == road.hitsMax) {
                    taskTable.terminate(task.id);
                }
            }

            // find new road tasks
            let roads = findRoadsNeedingRepair(room);
            for (let i=0; i < roads.length; i++) {
                let road = roads[i];
                let key = 'repair-road-' + road.id;
                if (!taskTable.exists(key)) {
                    taskTable.addTask({
                        id: key,
                        type: RepairRoadTask.TYPE,
                        goal: goalId,
                        roadId: road.id,
                        score: 10,
                        minWorkers: 1,
                        maxWorkers: 3,
                        assignedWorkers: {}
                    });
                }
            }
     
        }

    }

}

