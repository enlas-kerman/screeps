let Workers = require('task_Workers');
let Tasks = require('task_Tasks');
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
        tasks.removeTask(task);
    });
}


const cleanupDeadWorkers = (tasks, workers) => {
    let deadWorkers = workers.getDeadWorkers();
    deadWorkers.forEach((deadWorker) => {
        console.log("Cleaning up dead worker " + deadWorker.id);
        if (deadWorker.assignedTaskId) {
            let task = tasks.getTaskById(deadWorker.assignedTaskId);
            if (task.assignedWorkers[deadWorker.id]) {
                delete task.assignedWorkers[deadWorker.id];
            }
        }
    });
}


module.exports = {

    Supervisor: function() {

        let workers = new Workers(Game.creeps, Memory.supervisor.workers);
        let tasks = new Tasks(Game.rooms['W11N45'], Memory.supervisor.tasks);
        let strategy = new Strategy(Game.rooms['W11N45']);

        return {

            update: function() {
                console.log('**');
                console.log('** Supervisor Running');

                // let work = tasks.analyze();
                // unassign work.terminated
                // assign work.pending if necessary
                // update workers

                cleanupDeadWorkers(tasks, workers);

                strategy.assign(tasks, workers);

                cleanupTerminatedTasks(tasks, workers);

                workers.update(tasks);

                console.log('** Supervisor done');
                console.log('**');
            }

        };
    }


}