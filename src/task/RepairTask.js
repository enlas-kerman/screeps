let { doCollectEnergy, resetEnergyAffinity } = require('task_CollectEnergy');

const ST_INIT = 0;
const ST_COLLECT_ENERGY = 1;
const ST_REPAIR = 2;


const Task = class {

    constructor() {
        this._m = {};
    }


    _doInitState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() > 10) {
            worker.getTaskData().state = ST_REPAIR;
        } else {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            resetEnergyAffinity(worker);
        }
    }


    _doCollectEnergyState(worker) {
        if (doCollectEnergy(worker)) {
            worker.getTaskData().state = ST_REPAIR;
        }
    }


    _doRepairState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() == 0) {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            resetEnergyAffinity(worker);
            return;
        }

        let id = this._m.memory.targetId;
        let structure = Game.getObjectById(id);
        if (structure) {
            if (structure.hits < structure.hitsMax) {
                if (creep.repair(structure) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(structure);
                }
            }
        }
    }


    setState(state) {
        this._m.memory = state;
    }


    update(worker) {
        let data = worker.getTaskData();
        if (!data) {
            console.log("Warning: clearing data for task " + this._m.memory.id);
            worker.clearTaskData();
        }
        data.state = data.state || 0;
        console.log('[Repair ' + worker.getAssignedTaskId() + '] updating ' + worker.getId() + ',' + data.state);
        switch(data.state) {
            case ST_INIT:
                this._doInitState(worker);
                break;
            case ST_COLLECT_ENERGY:
                this._doCollectEnergyState(worker);
                break;
            case ST_REPAIR:
                this._doRepairState(worker);
                break;
            default:
                console.log('Warning: unknown state ' + data.state);
                data.state = ST_INIT;
                break;
        }
    }

}


Task.TYPE = 'repair';
module.exports = Task;
