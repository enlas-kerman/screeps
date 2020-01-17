
let Worker = require('task_Worker');


Memory.tasks = Memory.tasks || {};
Memory.tasks.workers = Memory.tasks.workers || {};
Memory.tasks.spawnQueue = Memory.tasks.spawnQueue || {};

Memory.tasks.workerIndex = Memory.tasks.workerIndex;

if (typeof Memory.nextWorkerId === 'undefined') {
    Memory.nextWorkerId = 0;
}


module.exports = function(creeps, workers) {

    for (workerId in workers) {
        if (!creeps[workerId]) {
            console.log('cleaning up worker: ' + workerId);
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


        unassign: function(workerId) {
            if (workers[workerId]) {
                workers[workerId].assignedTaskId = null;
            }
        },


        spawn: function(genetics) {
            let spawn = Game.spawns['MARA'];
            let workerId = '|' + Memory.nextWorkerId + '|';
            let err = spawn.spawnCreep([WORK, CARRY, MOVE], workerId, {
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

            Object.values(workers).forEach((worker) => {
                let workerId = worker.id;
                if (worker.assignedTaskId != null) {
                    console.log('updating the worker ' + workerId + ' for task ' + worker.assignedTaskId);
                    // let task = tasks.getTaskById(worker.assignedTaskId);
                    // task.update(worker);
                }
            });

            if (getWorkerCount() < 1) {
                this.spawn();
            }
        }
       
    }

}