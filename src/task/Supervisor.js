let Workers = require('task_Workers');
let Tasks = require('task_Tasks');
let Strategy = require('strategy_Strategy');


Memory.supervisor = Memory.supervisor || {};
Memory.supervisor.tasks = Memory.supervisor.tasks || {};
Memory.supervisor.workers = Memory.supervisor.workers || {};



module.exports = {

    Supervisor: function() {

        let workers = new Workers(Game.creeps, Memory.supervisor.workers);
        let tasks = new Tasks(Game.rooms['W11N45'], Memory.supervisor.tasks);
        let strategy = new Strategy();


        const assignWork = (pending, unassigned) => {
            console.log('* assign work');
            console.log('number of unassigned workers: ' + unassigned.length);
            pending.forEach((task) => {
                let minWorkers = typeof(task.minWorkers) == 'undefined' ? 10 : task.minWorkers;
                let currentWorkers = Object.keys(task.assignedWorkers).length;
                let neededWorkers = minWorkers - currentWorkers;
                while (neededWorkers > 0 && unassigned.length > 0) {
                    let worker = unassigned.shift();
                    console.log('  assigning ' + worker.id);
                    task.assignedWorkers[worker.id] = worker;
                    worker.assignedTaskId = task.id;
                }
            });
        }


        const cleanupTerminatedTasks = () => {
            tasks.getTerminatedTasks().forEach((task) => {
                let assignedWorkers = task.assignedWorkers;
                Object.values(assignedWorkers).forEach((workerId) => {
                    workers.unassign(workerId);
                });
                task.assignedWorkers = {};
                tasks.removeTask(task);
            });
        }


        const cleanupDeadWorkers = () => {
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


        return {

            update: function() {
                console.log('**');
                console.log('** Supervisor Running');

                // let work = tasks.analyze();
                // unassign work.terminated
                // assign work.pending if necessary
                // update workers

                cleanupDeadWorkers();

                tasks.analyze();

                cleanupTerminatedTasks();

                strategy.plan(tasks, workers);
                strategy.assign(tasks, workers);

                workers.update(tasks);

                console.log('** Supervisor done');
                console.log('**');
            }

        };
    }


}