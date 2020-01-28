let Workers = require('supervisor_Workers');
let Tasks = require('supervisor_Tasks');
let Strategy = require('strategy_Strategy');
let Debug = require('debug');

const ST_PAUSED = 0;
const ST_RUNNING = 1;

Memory.supervisors = Memory.supervisors || {};


const cleanupTerminatedTasks = (tasks, workers) => {
    tasks.getTerminatedTasks().forEach((task) => {
        let assignedWorkers = task.assignedWorkers;
        Object.values(assignedWorkers).forEach((workerId) => {
            workers.unassign(workerId);
        });
        task.assignedWorkers = {};
        tasks.removeTask(task.id);
    });
}


const cleanupDeadWorkers = (tasks, workers) => {
    let deadWorkers = workers.getDeadWorkers();
    deadWorkers.forEach((deadWorker) => {
        if (deadWorker.assignedTaskId) {
            let task = tasks.getById(deadWorker.assignedTaskId);
            if (task.assignedWorkers[deadWorker.id]) {
                delete task.assignedWorkers[deadWorker.id];
            }
        }
    });
}


const initMemory = (roomName) => {
    Memory.supervisors[roomName] = {
        tasks: {},
        workers: {},
        state: ST_RUNNING
    };
    return Memory.supervisors[roomName];
}




module.exports = class {

    constructor(roomName, maxWorkers) {
        this.roomName = roomName;
        this.maxWorkers = maxWorkers;
        this.memory = Memory.supervisors[roomName] || initMemory(roomName);
        this.workers = new Workers(roomName, Game.creeps, this.memory.workers, maxWorkers);
        this.tasks = new Tasks(Game.rooms[roomName], this.memory.tasks);
        this.strategy = new Strategy(Game.rooms[roomName]);
    }

    update() {
        let isDebugVisible = Debug.isDebugVisible();
        isDebugVisible && console.log('**');

        if (this.memory.state == ST_RUNNING) {
            isDebugVisible && console.log('** Supervisor Running [' + this.roomName + ']');

            cleanupDeadWorkers(this.tasks, this.workers);

            this.strategy.assign(this.tasks, this.workers);
    
            cleanupTerminatedTasks(this.tasks, this.workers);
    
            this.workers.update(this.tasks);

            isDebugVisible && console.log('** Supervisor done [' + this.roomName + ']');
        } else {
            console.log('** Supervisor paused [' + this.roomName + ']');
        }
    }


    pause() {
        this.memory.state = ST_PAUSED;
    }


    resume() {
        this.memory.state = ST_RUNNING;
    }


    purge() {
        console.log('purging tasks');
        let pending = this.tasks.getTasksByPriority();
        pending.forEach((task)=> {
            console.log('removing task: ' + task.id);
            let assignedWorkers = task.assignedWorkers;
            Object.values(assignedWorkers).forEach((workerId) => {
                console.log('  unassigning ' + workerId);
                this.workers.unassign(workerId);
            });
            task.assignedWorkers = {};
            this.tasks.removeTask(task.id);
        })
    }
}
