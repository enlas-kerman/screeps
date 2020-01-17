let RepairRoadGoal = require('task_RepairRoadGoal');
let RepairRoadTask = require('task_RepairRoadTask');

/**
 * 
 * memory.types
 * memory.index
 * 
 * @param {*} memory 
 * 
 */
const TaskTable = function(memory) {

    memory.terminated = memory.terminated || {};

    return {

        exists: function(id) {
            return typeof(memory.index[id]) !== 'undefined';
        },


        addTask: function(taskInfo) {
            console.log('adding task with id ' + taskInfo.id);
            let id = taskInfo.id;
            if (!memory.index[id]) {
                memory.index[id] = taskInfo;
                memory.types[taskInfo.type][id] = true;
            }
        },        


        // tasks cannot be removed if their are assigned workers
        removeTask: function(taskId) {
            if (memory.index[taskId]) {
                delete memory.index[taskId];
            }
            if (memory.terminated[taskId]) {
                if (Object.keys(memory.terminated[taskId].assignedWorkers).length > 0) {
                    console.log('Unable to remove terminated task because it has assigned workers. ' + taskId);
                } else {
                    delete memory.terminated[taskId];
                }
            }
        },


        terminate: function(taskId) {
            if (memory.index[taskId]) {
                let task = memory.index[taskId];
                memory.terminated[taskId] = task;
                delete memory.index[taskId];
                delete memory.types[task.type][taskId];
            }
        },


        getById: function(id) {
            return memory.index[id];
        },


        getByType: function(type) {
            var pending = [];
            for (id in memory.types[type]) {
                pending.push(memory.index[id]);
            }
            return pending;
        },


        getTerminatedTasks: function() {
            return Object.values(memory.terminated);
        },


        getTotalNumberAssigned: function(type) {
            let count = 0;
            for (id in memory.types[type]) {
                let task = memory.index[id];
                count += Object.keys(task.assignedWorkers).length;
            }
            return count;
        }

    }

}


module.exports = function(room, memory) {

    const goals = {};
    goals[RepairRoadGoal.TYPE] = new RepairRoadGoal();

    const taskFws = {}; // flyweight objects
    taskFws[RepairRoadTask.TYPE] = new RepairRoadTask();

    const tasks = new TaskTable(memory);

    return {

        analyze: function() {

            memory.types = memory.types || {};
            memory.index = memory.index || {};
            for (type in goals) {
                let goal = goals[type];
                memory.types[type] = memory.types[type] || {};
                goal.analyze(room, tasks);
            }
        },


        getTaskById: function(id) {
            return tasks.getById(id);
        },


        getPendingTasks: function(type) {
            return tasks.getByType(type);
        },


        getTotalNumberAssigned: function(type) {
            return tasks.getTotalNumberAssigned(type);
        },


        getTerminatedTasks: function() {
            return tasks.getTerminatedTasks();
        },


        removeTask: function(task) {
            tasks.removeTask(task.id);
        },


        getTaskFor: function(taskId) {
            let task = tasks.getById(taskId);
            if (task) {
                if (taskFws[task.type]) {
                    let taskFw = taskFws[task.type];
                    taskFw.setState(task);
                    return taskFw;
                } else {
                    console.log('Warning: task flyweight does not exist for type ' + task.type);
                }
            } else {
                console.log('Warning: task does not exist ' + taskId);
            }
        }

    }

}