let Workers = require('task_Workers');
let Tasks = require('task_Tasks');
let Strategy = require('strategy_Strategy');
let { BuildTasks, BuildTask } = require('task_BuildTask');
let { RepairRoadTasks, RepairRoadTask } = require('task_RepairRoadTask');


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
                console.log('cleaning up task ' + task.id);
                let assignedWorkers = task.assignedWorkers;
                console.log('number of assigned: ' + Object.keys(assignedWorkers).length);
                Object.values(assignedWorkers).forEach((workerId) => {
                    workers.unassign(workerId);
                });
                tasks.removeTerminated(task);
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