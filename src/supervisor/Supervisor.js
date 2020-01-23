let Workers = require('supervisor_Workers');
let Tasks = require('supervisor_Tasks');
let Strategy = require('strategy_Strategy');


Memory.supervisor = Memory.supervisor || {};
Memory.supervisor.tasks = Memory.supervisor.tasks || {};
Memory.supervisor.workers = Memory.supervisor.workers || {};


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


module.exports = class {

    constructor(roomName) {
        this.workers = new Workers(Game.creeps, Memory.supervisor.workers);
        this.tasks = new Tasks(Game.rooms[roomName], Memory.supervisor.tasks);
        this.strategy = new Strategy(Game.rooms[roomName]);
    }

    update() {
        console.log('**');
        console.log('** Supervisor Running');

        // let work = tasks.analyze();
        // unassign work.terminated
        // assign work.pending if necessary
        // update workers

        cleanupDeadWorkers(this.tasks, this.workers);

        this.strategy.assign(this.tasks, this.workers);

        cleanupTerminatedTasks(this.tasks, this.workers);

        this.workers.update(this.tasks);

        console.log('** Supervisor done');
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
