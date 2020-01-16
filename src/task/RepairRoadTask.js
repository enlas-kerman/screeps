
const TASK_REPAIR_ROAD = 'repair road';
const ROADS_TICS_REPAIR_THRESHOLD = 0.85;

Memory.tasks = Memory.tasks || {};
Memory.tasks.pending = Memory.tasks.pending || {};
Memory.tasks.terminated = Memory.tasks.terminated || {};
Memory.tasks.pending[TASK_REPAIR_ROAD] = Memory.tasks.pending[TASK_REPAIR_ROAD] || {};
Memory.tasks.terminated[TASK_REPAIR_ROAD] = Memory.tasks.terminated[TASK_REPAIR_ROAD] || {};


module.exports = {


    RepairRoadTasks: function() {

        const findRoadsNeedingRepair = (room) => {
            return room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    // repair once a roads hits drop below 85% max
                    return (s.structureType == STRUCTURE_ROAD) && ((s.hits / s.hitsMax) < ROADS_TICS_REPAIR_THRESHOLD);
                }
            });
        }


        return {
            analyze: function(room) {
                let roads = findRoadsNeedingRepair(room);

                let currentTasks = Memory.tasks.pending[TASK_REPAIR_ROAD];
                let updatedTasks = {};
                roads.forEach((road) => {
                    if (currentTasks[road.id]) {
                        updatedTasks[road.id] = currentTasks[road.id];
                    } else {
                        updatedTasks[road.id] = {
                            id: 'repair-road-' + road.id,
                            taskType: TASK_REPAIR_ROAD,
                            roadId: road.id,
                            baseScore: 1,
                            minWorkers: 3,
                            maxWorkers: 5,
                            assignedWorkers: {}
                        }
                    }
                });

                let terminatedTasks = Memory.tasks.terminated[TASK_REPAIR_ROAD];
                for (let roadId in currentTasks) {
                    if (!updatedTasks[roadId]) {
                        if (!terminatedTasks[roadId]) {
                            terminatedTasks[roadId] = currentTasks[roadId];
                        }
                    }
                }

                for (taskId in terminatedTasks) {
                    let terminatedTask = terminatedTasks[taskId];
                    if (Object.keys(terminatedTask.assignedWorkers).length == 0) {
                        delete terminatedTasks[taskId];
                    }
                }

                Memory.tasks.pending[TASK_REPAIR_ROAD] = updatedTasks;
                Memory.tasks.terminated[TASK_REPAIR_ROAD] = terminatedTasks;

            },

            getPending: function() {
                return Object.values(Memory.tasks.pending[TASK_REPAIR_ROAD]);
            },

            getTerminated: function() {
                return Object.values(Memory.tasks.terminated[TASK_REPAIR_ROAD]);
            },

            getUnassignedPending: function() {
                return this.getPending().filter((task) => {
                    return Object.keys(task.assignedCreeps).length < 3;
                });
            },

            getNumberPending: function() {
                return Object.keys(Memory.tasks.pending[TASK_REPAIR_ROAD]).length;
            },

            getNumberTerminated: function() {
                return Object.keys(Memory.tasks.terminated[TASK_REPAIR_ROAD]).length;
            }
        }
    },



    RepairRoadTask: function(taskId) {

    }

}