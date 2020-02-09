let Worker = require('supervisor_Worker');



if (typeof Memory.nextWorkerId === 'undefined') {
    Memory.nextWorkerId = 0;
}





module.exports = class {

    constructor(roomName, creeps, workers, energyMonitor) {
        this.roomName = roomName;
        this.creeps = creeps;
        this.workers = workers;
        this.energyMonitor = energyMonitor;
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


    getParts(room) {
        let availableEnergy = Math.min(1200, this.energyMonitor.getMax());
        console.log('Room ' + this.roomName + ': ' + availableEnergy + ' / ' + room.energyCapacityAvailable);
        //availableEnergy = Math.min(1600, room.energyCapacityAvailable);
        let numWork = Math.max(1, Math.floor(availableEnergy / 200));
        let parts = Array(numWork).fill(WORK)
                        .concat(Array(numWork).fill(CARRY))
                        .concat(Array(numWork).fill(MOVE));
        return parts;
    }


    getCost(parts) {
        let cost = 0;
        for(let i=0; i < parts.length; i++) {
            cost += BODYPART_COST[parts[i]];
        }
        return cost;
    }


    getWorkerInfo(room) {
        let sources = room.find(FIND_SOURCES);
        let minerals = room.find(FIND_MINERALS);
        const MAX_WORKERS = 7;
        const MIN_WORKERS = 4;
        const MAX_E = 1600;
        const MIN_E = 200;
        let parts = this.getParts(room);
        let cost = this.getCost(parts);
        if (cost > MAX_E) {
            throw new Error('cost of parts ' + cost + ' exceeds max energy ' + MAX_E);
        }
        let freeWorkers = MAX_WORKERS - Math.floor((cost - MIN_E) / (MAX_E - MIN_E) * (MAX_WORKERS - MIN_WORKERS))
        let totalWorkers = sources.length + minerals.length + freeWorkers;
        return {
            room: room.name,
            parts: parts,
            totalWorkers: totalWorkers
        }
    }


    spawn(workerInfo) {
        // console.log('room: ' + workerInfo.room);
        // console.log('parts: ' + workerInfo.parts);
        // console.log('total: ' + workerInfo.totalWorkers);

        let room = Game.rooms[this.roomName];
        let spawns = room.find(FIND_MY_SPAWNS);

        let parts = workerInfo.parts;

        let spawn = spawns[0];
        let workerId = '|' + Memory.nextWorkerId + '|';
        let err = spawn.spawnCreep(parts, workerId, {
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

        this.energyMonitor.update();
        //console.log('Energy[' + this.roomName + '] avg: ' + this.energyMonitor.getAverage());
        // console.log('    Head: ' + this.energyMonitor.memory.head);
        // console.log('    Tail: ' + this.energyMonitor.memory.tail);

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

        let room = Game.rooms[this.roomName];
        let workerInfo = this.getWorkerInfo(room);

        if (this.getWorkerCount() < workerInfo.totalWorkers) {
            this.spawn(workerInfo);
        }
    }


    getInfo() {
        let results = [];
        Object.values(this.workers).forEach((workerMem) => {
            let worker = new Worker();
            worker.setState(workerMem);
            results.push(worker);
        });
        results.sort((a,b) => {
            return a.getId() > b.getId();
        });
        return results;
    }
}