
const TASK_REPAIR_ROAD = 'repair road';
const ROADS_TICS_REPAIR_THRESHOLD = 0.85;




const findRoadsNeedingRepair = (room) => {
    return room.find(FIND_STRUCTURES, {
        filter: (s) => {
            // repair once a roads hits drop below 85% max
            return (s.structureType == STRUCTURE_ROAD) && ((s.hits / s.hitsMax) < ROADS_TICS_REPAIR_THRESHOLD);
        }
    });
}



module.exports = function() {
    
    return {
     
        analyze: function(room, tasks) {
        
            let pending = tasks.pending || {};
            let terminated = tasks.terminated || {};
    
            let newPending = {};
            let newTerminated = terminated; // terminated tasks are removed by super
    
            for (let id in pending) {
                let task = pending[id];
                let road = Game.getObjectById(task.roadId);
                // if a road was fully repaired, terminate the task
                // otherwise keep the task pending
                if (road.hits == road.hitsMax) {
                    newTerminated[id] = task;
                } else {
                    newPending[id] = task;
                }
            }
    
    
            // find new road tasks
            let roads = findRoadsNeedingRepair(room);
            roads.forEach((road) => {
                // create a task if doesnt already exist
                let key = 'repair-road-' + road.id;
                if (!newPending[key]) {
                    newPending[key] = {
                        id: key,
                        type: TASK_REPAIR_ROAD,
                        roadId: road.id,
                        baseScore: 1,
                        minWorkers: 3,
                        maxWorkers: 5,
                        assignedWorkers: {}
                    }
                }
            });
    
            console.log('number of roads needing repair: ' + Object.keys(newPending).length);
    
            return {
                pending: newPending,
                terminated: newTerminated
            };            
        }

    }

}

module.exports.TYPE = TASK_REPAIR_ROAD;
