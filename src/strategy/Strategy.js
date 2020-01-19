
let RepairRoadGoal = require('task_RepairRoadGoal');
let UpgradeControllerGoal = require('task_UpgradeControllerGoal');
let SpawnEnergyGoal = require('task_SpawnEnergyGoal');

module.exports = function(room) {

    const goals = {};
    goals['repair road goal'] = new RepairRoadGoal();
    goals['upgrade controller goal'] = new UpgradeControllerGoal();
    goals['spawn energy goal'] = new SpawnEnergyGoal();



    return {

        plan: function(tasks, workers) {

            for (type in goals) {
                let goal = goals[type];
                goal.analyze(room, tasks.getTaskTable());
            }

            //console.log('Strategy: updating plan');
            return tasks.getTasksByPriority();
        },

        assign: function(tasks, workers) {
            // initially implement a simple strategy
            // repair the roads (up to 2 workers)
            // fill the spawn (up to 3 workers)
            // upgrade the controller (as many as available)

            //console.log("Total assigned workers to road repairs: " + tasks.getTotalNumberAssigned('repair road'));

            let pending = this.plan(tasks, workers);
            console.log('Number of tasks pending: ' + pending.length);
            // pending.forEach((item) => {
            //     console.log('pending[' + item.id + ']: ' + item.score);
            // });

            let unassigned = workers.getUnassignedWorkers();
            console.log("Available workers: " + unassigned.length);



            // assign workers to tasks until we run out of workers
            for (let i=0; i < pending.length; i++) {
                let task = pending[i];
                while (Object.keys(task.assignedWorkers).length < task.minWorkers && unassigned.length > 0) {
                    let worker = unassigned.shift();
                    console.log('  assigning ' + worker.id + ' to task ' + task.id);
                    task.assignedWorkers[worker.id] = worker.id;
                    workers.assign(worker.id, task.id);
                }
            }

            // for each task A with less than min workers
            //  if there is a worker on a lower priority task B
            //  unassign worker from B
            //  assign worker to A
            // because the priority list is searched backwards,
            // lowest pri tasks give up workers to highest pri tasks
            for (let i=0; i < pending.length; i++) {
                let task = pending[i];
                if (Object.keys(task.assignedWorkers).length < task.minWorkers) {
                    for (j=pending.length-1; j > i; j--) {
                        let otherTask = pending[j];
                        if (otherTask.score >= task.score) {
                            //console.log('[' + task.id + '] no available workers found in lower priority tasks');
                            break;
                        }

                        let otherTaskWorkers = Object.values(otherTask.assignedWorkers);
                        if (otherTaskWorkers.length > 0) {
                            let reassignedWorkerId = otherTaskWorkers[0];
                            console.log('>>>>>>>>> reassigning worker ' + reassignedWorkerId + ' from lower priority task ' + otherTask.id);
                            
                            // unassign
                            workers.unassign(reassignedWorkerId);
                            delete otherTask.assignedWorkers[reassignedWorkerId];

                            // assign
                            task.assignedWorkers[reassignedWorkerId] = reassignedWorkerId;
                            workers.assign(reassignedWorkerId, task.id);
                        }

                        if (Object.keys(task.assignedWorkers).length >= task.minWorkers) {
                            break;
                        }
                    }

                }
            }
        }

    }

}