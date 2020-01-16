
let { Workers } = require('task_Workers');
let { BuildTasks, BuildTask } = require('task_BuildTask');
let { RepairRoadTasks, RepairRoadTask } = require('task_RepairRoadTask');



module.exports = {

    Supervisor: function() {

        let workers = new Workers(Game.creeps);
        let buildTasks = new BuildTasks();
        let repairRoadTasks = new RepairRoadTasks();


        const addUnassignedTasks = function(unassignedTasks, pendingTasks, scoreFn) {
            pendingTasks.forEach((task) => {
                task.score = scoreFn();
                if (typeof(task.minWorkers) == 'undefined' || Object.keys(task.assignedWorkers).length < task.minWorkers) {
                    unassignedTasks.push(task);
                }
            });
        }


        const unassign = function(tasks) {
            console.log('number of terminated: ' + tasks.length);
            tasks.forEach((task) => {
                for (workerId in task.assignedWorkers) {
                    let worker = workers.getWorkerById(workerId);
                    console.log('unassigning ' + worker + ' from task ' + task.id);
                    worker.assignedTaskId = null;
                }
                task.assignedWorkers = {};
            });
        }


        const analyzeSituation = () => {

            let room = Game.rooms['W11N45'];

            buildTasks.analyze(room);
            repairRoadTasks.analyze(room);

            unassign(repairRoadTasks.getTerminated());

            let pendingUnassignedTasks = [];

            //let pendingBuildTasks = buildTasks.getUnassignedPending();

            let pendingRepairRoadTasks = repairRoadTasks.getPending();
            console.log('number of pending road repairs: ' + pendingRepairRoadTasks.length);
            addUnassignedTasks(pendingUnassignedTasks, pendingRepairRoadTasks, (task) => 1000);

            pendingUnassignedTasks.sort((a,b) => {
                return a.score - b.score;
            });

            return pendingUnassignedTasks;
        }


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


        return {

            update: function() {
                console.log('** Supervisor Running');
                let pendingWork = analyzeSituation(Game.rooms['W11N45']);
                pendingWork.forEach((task) => {
                    //console.log('Work['+ task.taskType + '/' + task.id + ']: ' + task.score);
                });

                //reclaimWorkersFromTerminatedTasks();
                let unassignedWorkers = workers.getUnassignedWorkers();
                assignWork(pendingWork, unassignedWorkers);
                workers.update();
                console.log('** Supervisor done');
            }

        };
    }


}