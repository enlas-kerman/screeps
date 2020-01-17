let { BuildTasks, BuildTask } = require('task_BuildTask');
let RepairRoadTasks = require('task_RepairRoadTask');




module.exports = function(room, memory) {

    const buildTasks = new BuildTasks();

    const availableTasks = {};
    availableTasks[RepairRoadTasks.TYPE] = new RepairRoadTasks();


    return {

        analyze: function() {
            memory.types = memory.types || {};
            for (type in availableTasks) {
                let task = availableTasks[type];
                memory.types[type] = memory.types[type] || {};
                memory.types[type] = task.analyze(room, memory.types[type]);
            }
        },


        getTaskById: function(id) {
            return availableTasks[id];
        },


        getPendingTasks: function(type) {
            return memory.types[type].pending;
        },


        getTotalNumberAssigned: function(type) {
            let count = 0;
            Object.values(memory.types[type].pending).forEach((task) => {
                count += Object.keys(task.assignedWorkers).length;
            });
            return count;
        },


        getTerminatedTasks: function() {
            let terminated = [];
            for (type in memory.types) {
                terminated = terminated.concat(Object.values(memory.types[type].terminated));
            }
            return terminated;
        },


        removeTerminated: function(task) {
            console.log('task.type: ' + task.type);
            console.log(delete memory.types[task.type].terminated[task.id]);
        }

    }

}