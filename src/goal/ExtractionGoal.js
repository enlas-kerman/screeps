let ExtractionTask = require('task_ExtractionTask');
let DeliverTask = require('task_DeliverTask');


const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    }


    analyzeExtraction(room, tasks) {
        let pendingTasks = tasks.getByType(ExtractionTask.TYPE, {
            filter: {
                goal: this.goalId
            }
        });
        for (let i=0; i < pendingTasks.length; i++) {
            let task = pendingTasks[i];
            let target = Game.getObjectById(task.targetId);
            let mineral = Game.getObjectById(task.mineralId);
            if (target == null || target.store.getFreeCapacity() == 0 || mineral.mineralAmount == 0) {
                tasks.terminate(task.id);
            }
        }

        let containers = this.findAvailableContainers(room);
        let minerals = room.find(FIND_MINERALS);
        for (let i=0; i < containers.length; i++) {
            let container = containers[i];
            let mineral = this.getMineral(container, minerals);
            if (mineral && mineral.mineralAmount > 0) {
                let key = ExtractionTask.TYPE + '-' + container.id;
                if (!tasks.exists(key) && (container.store.getFreeCapacity() > 200)) {
                    tasks.addTask({
                        id: key,
                        type: ExtractionTask.TYPE,
                        goal: this.goalId,
                        targetId: container.id,
                        mineralId: mineral.id,
                        mineralType: mineral.mineralType,
                        score: 89,
                        minWorkers: 1,
                        maxWorkers: 1,
                        assignedWorkers: {}
                    });
                }
            }
        }
    }


    analyzeDelivery(room, tasks) {
        let pendingTasks = tasks.getByType(DeliverTask.TYPE, {
            filter: {
                goal: this.goalId
            }
        });
        for (let i=0; i < pendingTasks.length; i++) {
            let task = pendingTasks[i];
            let destination = Game.getObjectById(task.targetId);
            if (!destination || destination.store.getFreeCapacity(task.resourceType) == 0) {
                tasks.terminate(task.id);
            } else {
                let source = Game.getObjectById(task.sourceId);
                if (!source || source.store.getUsedCapacity(task.resourceType) < 100) {
                    tasks.terminate(task.id);
                }
            }
        }

        let storage = this.findStorage(room);
        if (storage && storage.store.getFreeCapacity() > 0) {
            let containers = this.findContainersWithMinerals(room);
            for (let i=0; i < containers.length; i++) {
                let container = containers[i].container;
                let key = DeliverTask.TYPE + '-' + container.id + '/' + storage.id;
                for (let resourceIndex = 0; resourceIndex < containers[i].resources.length; resourceIndex++) {
                    let resourceType = containers[i].resources[resourceIndex];
                    if (!tasks.exists(key) && (container.store.getUsedCapacity(resourceType) > 1000)) {
                        tasks.addTask({
                            id: key,
                            type: DeliverTask.TYPE,
                            goal: this.goalId,
                            sourceId: container.id,
                            targetId: storage.id,
                            resourceType: resourceType,
                            score: 98,
                            minWorkers: 1,
                            maxWorkers: 2,
                            assignedWorkers: {}
                        });
                    }
                }
            }
        }
    }


    analyze(room, tasks) {
        this.analyzeExtraction(room, tasks);
        this.analyzeDelivery(room, tasks);
    }


    findStorage(room) {
        let storage = room.find(FIND_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_STORAGE
            }
        });
        if (storage.length > 0) {
            return storage[0];
        }
    }


    findContainersWithMinerals(room) {
        let containers = room.find(FIND_STRUCTURES, {
            filter: {
                structureType: STRUCTURE_CONTAINER
            }
        });
        let found = [];
        for (let i=0; i < containers.length; i++) {
            let container = containers[i];
            let resources = [];
            for (let name in container.store) {
                name !== RESOURCE_ENERGY ? resources.push(name) : {};
            }
            if (resources.length > 0) {
                found.push({
                    container: container,
                    resources: resources
                });
            }
        }
        return found;
    }


    findAvailableContainers(room) {
        return room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType == STRUCTURE_CONTAINER) && s.store.getFreeCapacity() > 0;
            }
        });
    }


    getMineral(container, minerals) {
        let nearbyMinerals = container.pos.findInRange(minerals, 1);
        if (nearbyMinerals.length > 0) {
            return nearbyMinerals[0];
        }
    }

}


module.exports = Goal;