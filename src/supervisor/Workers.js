let Worker = require('supervisor_Worker');



if (typeof Memory.nextWorkerId === 'undefined') {
    Memory.nextWorkerId = 0;
}



module.exports = class {

    constructor(roomName, creeps, workers, maxWorkers) {
        this.roomName = roomName;
        this.creeps = creeps;
        this.workers = workers;
        this.maxWorkers = maxWorkers;
        this.deadWorkers = [];

        for (let workerId in workers) {
            if (!creeps[workerId]) {
                this.deadWorkers.push(workers[workerId]);
                delete workers[workerId];
                delete Memory.creeps[workerId];
            }
        }
    }


    getWorkerCount() {
        return Object.keys(this.workers).length;
    }


    getWorkerById(id) {
        return this.workers[id];
    }


    getDeadWorkers() {
        return this.deadWorkers;
    }


    getUnassignedWorkers() {
        let unassigned = [];
        for (let id in this.workers) {
            let worker = this.workers[id];
            if (worker.assignedTaskId == null) {
                unassigned.push(worker);
            }
        }
        return unassigned;
    }


    assign(workerId, taskId) {
        let worker = new Worker();
        worker.setState(this.workers[workerId]);
        worker.assignToTask(taskId);
    }


    unassign(workerId) {
        if (this.workers[workerId]) {
            let worker = new Worker();
            worker.setState(this.workers[workerId]);
            worker.unassign();
        }
    }


    spawn(genetics) {
        let room = Game.rooms[this.roomName];
        let spawns = room.find(FIND_MY_SPAWNS);
        if (room.energyCapacityAvailable < 1000 || spawns.length == 0) {
            spawns = [Game.spawns['MARA']];
        }

        let spawn = spawns[0];
        let workerId = '|' + Memory.nextWorkerId + '|';
        let err = spawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE], workerId, {
            memory: {
                role: 'worker'
            }
        });
        if (err == OK) {
            this.workers[workerId] = {
                id: workerId,
                assignedTaskId: null
            };
            Memory.nextWorkerId++;
        } else {
            //console.log('Spawn ' + spawn.id + ' error: ' + err);
        }
    }


    update(tasks) {

        let worker = new Worker();

        Object.values(this.workers).forEach((workerMem) => {
            worker.setState(workerMem);
            let workerId = worker.getId();
            let assignedTaskId = worker.getAssignedTaskId();
            if (assignedTaskId != null) {
                //console.log('updating the worker ' + workerId + ' for task ' + assignedTaskId);
                let task = tasks.getTaskFor(assignedTaskId);
                if (task) {
                    task.update(worker);
                } else {
                    console.log("Workers.update: No task found for " + assignedTaskId);
                    this.unassign(workerId);
                }
            }
        });

        if (this.getWorkerCount() < this.maxWorkers) {
            this.spawn();
        }
    }

}