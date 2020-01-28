
const RepairGoal = require('goal_RepairGoal');
const UpgradeControllerGoal = require('goal_UpgradeControllerGoal');
const SpawnEnergyGoal = require('goal_SpawnEnergyGoal');
const BuildGoal = require('goal_BuildGoal');
const HarvestingGoal = require('goal_HarvestingGoal');
const ExtractionGoal = require('goal_ExtractionGoal');
const Debug = require('debug');

const MINIMUM_TASK_RANGE = 14;

module.exports = class {

    constructor(room) {
        this.room = room;

        this.goals = {};
        this.goals['repair goal'] = new RepairGoal('RepairGoal-' + room.name);
        this.goals['upgrade controller goal'] = new UpgradeControllerGoal('UpgradeControllerGoal-' + room.name);
        this.goals['spawn energy goal'] = new SpawnEnergyGoal('SpawnEnergyGoal-' + room.name);
        this.goals['build goal'] = new BuildGoal('BuildGoal-' + room.name);
        this.goals['harvesting'] = new HarvestingGoal('HarvestingGoal-' + room.name);
        this.goals['extraction'] = new ExtractionGoal('ExtractionGoal-' + room.name);
    }


    plan(tasks, workers) {

        for (let type in this.goals) {
            let goal = this.goals[type];
            goal.analyze(this.room, tasks);
        }

        return tasks.getTasksByPriority();
    }


    drawTaskRanges(visual, tasks) {
        for (let i=0; i < tasks.length; i++) {
            let task = tasks[i];
            if (task.targetId) {
                let object = Game.getObjectById(task.targetId);
                if (object.pos) {
                    let isAssigned = Object.keys(task.assignedWorkers).length > 0;
                    let fill = isAssigned ? '#20a02020' : '#5050ff20';
                    let stroke = isAssigned ? '#20a02080' : '#5050ff80';
                    visual.circle(object.pos, {
                        radius: MINIMUM_TASK_RANGE,
                        stroke: stroke,
                        fill: fill
                    });

                    for (let workerId in task.assignedWorkers) {
                        let creep = Game.creeps[workerId];
                        if (creep && object) {
                            let color = object.room == creep.room ? '#e06060ff' : '#ffffff30';
                            visual.line(object.pos, creep.pos, {
                                color: color,
                                lineStyle: 'dashed',
                                width: 0.2
                            });
                        }
                    }
                }
            }
        }
    }


    assign(tasks, workers) {
        let isDebugVisible = Debug.isDebugVisible();

        let pending = this.plan(tasks, workers);
        if (Debug.isTaskRangeVisible()) {
            this.drawTaskRanges(this.room.visual, pending);
        }

        let unassigned = workers.getUnassignedWorkers();
        isDebugVisible && console.log('Pending Tasks: ' + pending.length + '  --  Available Workers: ' + unassigned.length);


        // assign workers to tasks until we run out of workers
        for (let i=0; i < pending.length; i++) {
            let task = pending[i];
            while (Object.keys(task.assignedWorkers).length < task.minWorkers && unassigned.length > 0) {
                let worker = unassigned.shift();
                isDebugVisible && console.log('  assigning ' + worker.id + ' to task ' + task.id);
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
                    for (let k=0; k < otherTaskWorkers.length && Object.keys(task.assignedWorkers).length < task.minWorkers; k++) {
                        let otherTaskWorker = otherTaskWorkers[k];
                        let otherTaskCreep = Game.creeps[otherTaskWorker];
                        if (otherTaskCreep && task.targetId) {
                            let taskTarget = Game.getObjectById(task.targetId);
                            if (taskTarget) {
                                let range = taskTarget.pos.getRangeTo(otherTaskCreep);
                                if (range < MINIMUM_TASK_RANGE) {
                                    isDebugVisible && console.log('>>>>>>>>> reassigning worker ' + otherTaskWorker + ' from lower priority task ' + otherTask.id);

                                    // unassign
                                    workers.unassign(otherTaskWorker);
                                    delete otherTask.assignedWorkers[otherTaskWorker];
    
                                    // assign
                                    task.assignedWorkers[otherTaskWorker] = otherTaskWorker;
                                    workers.assign(otherTaskWorker, task.id); 
                                }
                            }                                
                        }
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