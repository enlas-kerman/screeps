const DeliverTask = require('task_DeliverTask');


const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    };


    getCarryUsedCapacity(task) {
        let inv = 0;
        for (let workerId in task.assignedWorkers) {
            let creep = Game.creeps[workerId];
            if (creep) {
                inv += creep.store.getUsedCapacity();
            }
        }
        return inv;
    }


    analyze(room, tasks) {
        let storage = room.storage;

        let pendingTasks = tasks.getByType(DeliverTask.TYPE, {
            filter: {
                goal: this.goalId
            }
        });
        for (let i=0; i < pendingTasks.length; i++) {
            let task = pendingTasks[i];
            let source = Game.getObjectById(task.sourceId);
            let target = Game.getObjectById(task.targetId);
            let carryInv = this.getCarryUsedCapacity(task);
            if (!storage || storage.store.getFreeCapacity() == 0) {
                tasks.terminate(task.id);
            } else
            if (!source && carryInv == 0) {
                tasks.terminate(task.id);
            } else
            if (source && source.store && source.store.getUsedCapacity() == 0 && carryInv == 0) {
                tasks.terminate(task.id);
            } else
            if (source && typeof(source.amount) != 'undefined' && source.amount == 0 && carryInv == 0) {
                tasks.terminate(task.id);
            }
        }

        if (!storage) {
            return;
        }

        let sources = this.findScavengableRuins(room);
        if (storage && sources.length > 0) {
            for (let i=0; i < sources.length; i++) {
                let source = sources[i];
                let key = DeliverTask.TYPE + '-' + source.id;
                if (!tasks.exists(key)) {
                    tasks.addTask({
                        id: key,
                        type: DeliverTask.TYPE,
                        goal: this.goalId,
                        sourceId: source.id,
                        targetId: storage.id,
                        resourceType: '*',
                        score: 15,
                        minWorkers: 1,
                        maxWorkers: 1,
                        assignedWorkers: {}
                    });
                }
            }
        }


        let drops = this.findScavengableDrops(room);
        if (drops.length > 0) {
            for (let i=0; i < drops.length; i++) {
                let drop = drops[i];
                let key = DeliverTask.TYPE + '-' + drop.id;
                if (!tasks.exists(key)) {
                    tasks.addTask({
                        id: key,
                        type: DeliverTask.TYPE,
                        goal: this.goalId,
                        sourceId: drop.id,
                        targetId: storage.id,
                        resourceType: drop.resourceType,
                        score: 16,
                        minWorkers: 1,
                        maxWorkers: 1,
                        assignedWorkers: {}
                    });
                }
            }
        }

    }


    findScavengableDrops(room) {
        return room.find(FIND_DROPPED_RESOURCES);
    }


    findScavengableRuins(room) {
        let structs = room.find(FIND_RUINS, {
            filter: (struct) => {
                return struct.store.getUsedCapacity() > 0;
            }
        });

        let tombstones = room.find(FIND_TOMBSTONES, {
            filter: (struct) => {
                return struct.store.getUsedCapacity() > 0;
            }
        });

        return structs.concat(tombstones);
    }

}


module.exports = Goal;