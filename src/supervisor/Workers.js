let Worker = require('supervisor_Worker');

const MAX_WORKERS = 8;


if (typeof Memory.nextWorkerId === 'undefined') {
    Memory.nextWorkerId = 0;
}


module.exports = function(creeps, workers) {

    const deadWorkers = [];

    for (workerId in workers) {
        if (!creeps[workerId]) {
            console.log('cleaning up worker: ' + workerId);
            deadWorkers.push(workers[workerId]);
            delete workers[workerId];
        }
    }

    const getWorkerCount = () => {
        return Object.keys(workers).length;
    }


    return {

        getWorkerById: function(id) {
            return workers[id];
        },


        getDeadWorkers: function() {
            return deadWorkers;
        },


        getUnassignedWorkers: function() {
            let unassigned = [];
            for (id in workers) {
                let worker = workers[id];
                if (worker.assignedTaskId == null) {
                    unassigned.push(worker);
                }
            }
            return unassigned;
        },


        assign: function(workerId, taskId) {
            let worker = new Worker();
            worker.setState(workers[workerId]);
            worker.assignToTask(taskId);
        },


        unassign: function(workerId) {
            console.log('unassigning ' + workerId);
            if (workers[workerId]) {
                let worker = new Worker();
                worker.setState(workers[workerId]);
                worker.unassign();
            }
        },


        spawn: function(genetics) {
            let spawn = Game.spawns['MARA'];
            let workerId = '|' + Memory.nextWorkerId + '|';
            let err = spawn.spawnCreep([WORK, WORK, CARRY, MOVE], workerId, {
                memory: {
                    role: 'worker'
                }
            });
            if (err == OK) {
                workers[workerId] = {
                    id: workerId,
                    assignedTaskId: null
                };
                Memory.nextWorkerId++;
            }
        },


        update: function(tasks) {

            let worker = new Worker();

            Object.values(workers).forEach((workerMem) => {
                worker.setState(workerMem);
                let workerId = worker.getId();
                let assignedTaskId = worker.getAssignedTaskId();
                if (assignedTaskId != null) {
                    //console.log('updating the worker ' + workerId + ' for task ' + assignedTaskId);
                    let task = tasks.getTaskFor(assignedTaskId);
                    if (task) {
                        task.update(worker);
                    } else {
                        console.log("No task found for " + assignedTaskId);
                        this.unassign(workerId);
                    }
                }
            });

            if (getWorkerCount() < MAX_WORKERS) {
                this.spawn();
            }
        }
       
    }

}