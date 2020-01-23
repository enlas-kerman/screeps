
let RepairGoal = require('task_RepairGoal');
let UpgradeControllerGoal = require('task_UpgradeControllerGoal');
let SpawnEnergyGoal = require('task_SpawnEnergyGoal');
let BuildGoal = require('task_BuildGoal');
let HarvestingGoal = require('task_HarvestingGoal');


module.exports = class {

    constructor(room) {
        this.room = room;

        this.goals = {};
        this.goals['repair goal'] = new RepairGoal('RepairGoal-' + room.name);
        this.goals['upgrade controller goal'] = new UpgradeControllerGoal('UpgradeControllerGoal-' + room.name);
        this.goals['spawn energy goal'] = new SpawnEnergyGoal('SpawnEnergyGoal-' + room.name);
        this.goals['build goal'] = new BuildGoal('BuildGoal-' + room.name);
        this.goals['harvesting'] = new HarvestingGoal('HarvestingGoal-' + room.name);
    }


    plan(tasks, workers) {

        for (let type in this.goals) {
            let goal = this.goals[type];
            goal.analyze(this.room, tasks);
        }

        //console.log('Strategy: updating plan');
        return tasks.getTasksByPriority();
    }


    assign(tasks, workers) {

        let pending = this.plan(tasks, workers);
        console.log('Number of tasks pending: ' + pending.length);

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
                for (let j=pending.length-1; j > i; j--) {
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


    describeGoals() {
        let goalDescs = [];
        for (let name in this.goals) {
            let goal = this.goals[name];
            goalDescs.push({
                name: name,
                description: goal.describe ? goal.describe() : 'No description.'
            })
        }
        return goalDescs;
    }

}