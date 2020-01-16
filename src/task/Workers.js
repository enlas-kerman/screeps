
let Worker = require('task_Worker');


Memory.tasks = Memory.tasks || {};
Memory.tasks.workers = Memory.tasks.workers || {};
Memory.tasks.spawnQueue = Memory.tasks.spawnQueue || {};

Memory.tasks.workerIndex = Memory.tasks.workerIndex;

if (typeof Memory.nextWorkerId === 'undefined') {
    Memory.nextWorkerId = 0;
}


module.exports = {

    Workers: function(creeps) {

        let workers = Memory.tasks.workers;

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


            update: function() {

                Object.values(workers).forEach((worker) => {
                    let workerId = worker.id;
                    if (worker.assignedTaskId != null) {
                        console.log('updating the worker ' + workerId + ' for task ' + worker.assignedTaskId);
                    }
                });

                if (getWorkerCount() < 1) {
                    this.spawn();
                }
            }
        }

    }

}