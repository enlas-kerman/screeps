let RepairTask = require('task_RepairTask');
let UpgradeControllerTask = require('task_UpgradeControllerTask');
let DeliverEnergyTask = require('task_DeliverEnergyTask');
let BuildTask = require('task_BuildTask');
let HarvestingTask = require('task_HarvestingTask');


/**
 * Task flyweights.  Defined module-scope to avoid rebuilding them every tic
 */
const taskFws = {};
taskFws[RepairTask.TYPE] = new RepairTask();
taskFws[UpgradeControllerTask.TYPE] = new UpgradeControllerTask();
taskFws[DeliverEnergyTask.TYPE] = new DeliverEnergyTask();
taskFws[BuildTask.TYPE] = new BuildTask();
taskFws[HarvestingTask.TYPE] = new HarvestingTask();

const Tasks = class {

    constructor(room, memory) {
        this.room = room;
        this.memory = memory;

        memory.index = memory.index || {};
        memory.types = memory.types || {};
        memory.types[RepairTask.TYPE] = memory.types[RepairTask.TYPE] || {};
        memory.types[UpgradeControllerTask.TYPE] = memory.types[UpgradeControllerTask.TYPE] || {};
        memory.types[DeliverEnergyTask.TYPE] = memory.types[DeliverEnergyTask.TYPE] || {};
        memory.types[BuildTask.TYPE] = memory.types[BuildTask.TYPE] || {};    
        memory.types[HarvestingTask.TYPE] = memory.types[HarvestingTask.TYPE] || {};    
        memory.terminated = memory.terminated || {};

    }
 

    exists(id) {
        return typeof(this.memory.index[id]) !== 'undefined';
    }


    addTask(taskInfo) {
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
        if (!this.memory.index[id]) {
            this.memory.index[id] = taskInfo;
            this.memory.types[taskInfo.type] = this.memory.types[taskInfo.type] || {};
            this.memory.types[taskInfo.type][id] = true;
        }
        return taskInfo;
    }


    removeTask(taskId) {
        if (this.memory.index[taskId]) {
            let type = this.memory.index[taskId].type;
            delete this.memory.index[taskId];
            delete this.memory.types[type][taskId];
        }
        if (this.memory.terminated[taskId]) {
            if (Object.keys(this.memory.terminated[taskId].assignedWorkers).length > 0) {
                console.log('Unable to remove terminated task because it has assigned workers. ' + taskId);
            } else {
                delete this.memory.terminated[taskId];
            }
        }
    }


    terminate(taskId) {
        if (this.memory.index[taskId]) {
            let task = this.memory.index[taskId];
            this.memory.terminated[taskId] = task;
            delete this.memory.index[taskId];
            delete this.memory.types[task.type][taskId];
        }
    }


    getById(id) {
        return this.memory.index[id];
    }


    getByType(type, opts) {
        let typeTasks = Object.keys(this.memory.types[type]);
        let tasks = new Array(typeTasks.length);
        for (let i=0; i < typeTasks.length; i++) {
            tasks[i] = this.memory.index[typeTasks[i]];
        }
        if (opts && opts.filter) {
            tasks = _.filter(tasks, opts.filter);
        }
        return tasks;
    }

    
    getTerminatedTasks() {
        return Object.values(this.memory.terminated);
    }


    getTotalNumberAssigned(type) {
        let count = 0;
        for (id in this.memory.types[type]) {
            let task = this.memory.index[id];
            count += Object.keys(task.assignedWorkers).length;
        }
        return count;
    }


    getTasksByPriority() {
        var tasks = Object.values(this.memory.index);
        tasks.sort((a,b) => {
            return b.score - a.score;
        });
        return tasks;
    }


    getTaskFor(taskId) {
        let task = this.getById(taskId);
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

module.exports = Tasks;
