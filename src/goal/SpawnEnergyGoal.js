let FillEnergyTask = require('task_FillEnergyTask');


const findSpawnsAndExtsNeedingEnergy = (room) => {
    return room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        }
    });
}


const findTowersNeedingEnergy = (room) => {
    return room.find(FIND_STRUCTURES, {
        filter: (s) => {
            return (s.structureType == STRUCTURE_TOWER) && (s.store.getFreeCapacity(RESOURCE_ENERGY) > s.store.getCapacity(RESOURCE_ENERGY) * 0.25);
        }
    });
}



const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    }


    analyze(room, tasks) {
        let spawnExts = findSpawnsAndExtsNeedingEnergy(room);
        let spawnExtsKey = FillEnergyTask.TYPE + '-spawn-' + room.name;
        if (spawnExts.length == 0) {
            if (tasks.exists(spawnExtsKey)) {
                tasks.terminate(spawnExtsKey);
            }
        } else {
            let task = null;
            if (!tasks.exists(spawnExtsKey)) {                
                task = tasks.addTask({
                    id: spawnExtsKey,
                    type: FillEnergyTask.TYPE,
                    goal: this.goalId,
                    score: 97,
                    minWorkers: 3,
                    maxWorkers: 5,
                    assignedWorkers: {}
                });
            } else {
                task = tasks.getById(spawnExtsKey);
            }
            this.updateTargets(task, spawnExts);
        }

        let towers = findTowersNeedingEnergy(room);
        let towersKey = FillEnergyTask.TYPE + '-tower-' + room.name;
        if (towers.length == 0) {
            if (tasks.exists(towersKey)) {
                tasks.terminate(towersKey);
            }
        } else {
            let task = null;
            if (!tasks.exists(towersKey)) {
                task = tasks.addTask({
                    id: towersKey,
                    type: FillEnergyTask.TYPE,
                    goal: this.goalId,
                    score: 96,
                    minWorkers: 2,
                    maxWorkers: 2,
                    assignedWorkers: {}
                });
            } else {
                task = tasks.getById(towersKey);
            }
            this.updateTargets(task, towers);
        }
    }


    updateTargets(task, newTargets) {
        let targets = {};
        let oldTargets = task.targetIds;
        if (oldTargets) {
            for (let targetId in oldTargets) {
                let target = Game.getObjectById(targetId);
                if (target && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    targets[targetId] = true;
                }
            }
        }

        for(let i=0; i < newTargets.length; i++) {
            let newTarget = newTargets[i];
            targets[newTarget.id] = true;
        }
        task.targetIds = targets;
    }


}

module.exports = Goal;