
/**
 * This goal attempts to maintain the roads within a room.
 * When roads fall below a threshold of hits, this goal
 * plans repair tasks to repair them.
 */

const TASK_REPAIR_ROAD = 'repair road';
const ROADS_TICS_REPAIR_THRESHOLD = 0.85;



module.exports = function() {
    

    const findRoadsNeedingRepair = (room) => {
        return room.find(FIND_STRUCTURES, {
            filter: (s) => {
                // repair once a roads hits drop below 85% max
                return (s.structureType == STRUCTURE_ROAD) && ((s.hits / s.hitsMax) < ROADS_TICS_REPAIR_THRESHOLD);
            }
        });
    }


    return {
     
        analyze: function(room, taskTable) {
        
            let pendingTasks = taskTable.getByType(TASK_REPAIR_ROAD);
            for (let i=0; i < pendingTasks.length; i++) {
                let task = pendingTasks[i];
                //console.log('pending task: ' + task.id);
                let road = Game.getObjectById(task.roadId);
                // if a road was fully repaired, terminate the task
                // otherwise keep the task pending
                if (road.hits == road.hitsMax) {
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
                        type: TASK_REPAIR_ROAD,
                        roadId: road.id,
                        baseScore: 1,
                        minWorkers: 3,
                        maxWorkers: 5,
                        assignedWorkers: {}
                    });
                }
            }
     
        }

    }

}

module.exports.TYPE = TASK_REPAIR_ROAD;
