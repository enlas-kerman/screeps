let Workers = require('supervisor_Workers');
let Tasks = require('supervisor_Tasks');
let Strategy = require('strategy_Strategy');


const ST_PAUSED = 0;
const ST_RUNNING = 1;

Memory.supervisors = Memory.supervisors || {};
// Memory.supervisor = Memory.supervisor || {};
// Memory.supervisor.tasks = Memory.supervisor.tasks || {};
// Memory.supervisor.workers = Memory.supervisor.workers || {};


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
        console.log("Cleaning up dead worker " + deadWorker.id);
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

    constructor(roomName) {
        this.memory = Memory.supervisors[roomName] || initMemory(roomName);
        this.workers = new Workers(Game.creeps, this.memory.workers);
        this.tasks = new Tasks(Game.rooms[roomName], this.memory.tasks);
        this.strategy = new Strategy(Game.rooms[roomName]);
    }

    update() {
        console.log('**');

        if (this.memory.state == ST_RUNNING) {
            console.log('** Supervisor Running');

            cleanupDeadWorkers(this.tasks, this.workers);

            this.strategy.assign(this.tasks, this.workers);
    
            cleanupTerminatedTasks(this.tasks, this.workers);
    
            this.workers.update(this.tasks);

            console.log('** Supervisor done');
        } else {
            console.log('** Supervisor paused');
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
