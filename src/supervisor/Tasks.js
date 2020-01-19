let RepairRoadTask = require('task_RepairRoadTask');
let UpgradeControllerTask = require('task_UpgradeControllerTask');
let DeliverEnergyTask = require('task_DeliverEnergyTask');
let BuildTask = require('task_BuildTask');

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
            console.log('adding task with id ' + taskInfo.id + ' and type ' + taskInfo.type);
            if (typeof(taskInfo.score) == 'undefined') {
                taskInfo.score = 0;
            }
            if (typeof(taskInfo.minWorkers) == 'undefined') {
                taskInfo.minWorkers = 1;
            }
            if (typeof(taskInfo.maxWorkers) == 'undefined') {
                taskInfo.maxWorkers = 1;
            }
            taskInfo.assignedWorkers = taskInfo.assignedWorkers || {};
            let id = taskInfo.id;
            if (!memory.index[id]) {
                memory.index[id] = taskInfo;
                memory.types[taskInfo.type] = memory.types[taskInfo.type] || {};
                memory.types[taskInfo.type][id] = true;
            }
            return taskInfo;
        },        


        // tasks cannot be removed if their are assigned workers
        removeTask: function(taskId) {
            if (memory.index[taskId]) {
                let type = memory.index[taskId].type;
                delete memory.index[taskId];
                delete memory.types[type][taskId];
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


        getByType: function(type, opts) {
            let typeTasks = Object.keys(memory.types[type]);
            let tasks = new Array(typeTasks.length);
            for (let i=0; i < typeTasks.length; i++) {
                tasks[i] = memory.index[typeTasks[i]];
            }
            if (opts && opts.filter) {
                tasks = _.filter(tasks, opts.filter);
            }
            return tasks;
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
        },


        getTasksByPriority: function() {
            var tasks = Object.values(memory.index);
            tasks.sort((a,b) => {
                return b.score - a.score;
            });
            return tasks;
        }

    }

}


module.exports = function(room, memory) {

    memory.types = memory.types || {};
    memory.index = memory.index || {};

    const taskFws = {}; // flyweight objects
    taskFws[RepairRoadTask.TYPE] = new RepairRoadTask();
    taskFws[UpgradeControllerTask.TYPE] = new UpgradeControllerTask();
    taskFws[DeliverEnergyTask.TYPE] = new DeliverEnergyTask();
    taskFws[BuildTask.TYPE] = new BuildTask();

    memory.types[RepairRoadTask.TYPE] = memory.types[RepairRoadTask.TYPE] || {};
    memory.types[UpgradeControllerTask.TYPE] = memory.types[UpgradeControllerTask.TYPE] || {};
    memory.types[DeliverEnergyTask.TYPE] = memory.types[DeliverEnergyTask.TYPE] || {};
    memory.types[BuildTask.TYPE] = memory.types[BuildTask.TYPE] || {};

    const tasks = new TaskTable(memory);

    return {

        analyze: function() {

            // for (type in goals) {
            //     let goal = goals[type];
            //     memory.types[type] = memory.types[type] || {};
            //     goal.analyze(room, tasks);
            // }
        },

        getTaskTable: function() {
            return tasks;
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
        },


        getTasksByPriority: function() {
            return tasks.getTasksByPriority();
        }

    }

}