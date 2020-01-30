let { doCollectEnergy } = require('task_CollectEnergy');


const ST_INIT = 0;
const ST_COLLECT_ENERGY = 1;
const ST_DELIVER = 2;



const Task = class {

    constructor() {
        this._m = {};
    }


    _doInitState(worker) {
        let creep = worker.getCreep();
        for (let name in creep.store) {
            if (name !== RESOURCE_ENERGY) {
                creep.drop(name);
            }
        }
        if (creep.store.getUsedCapacity() > 30) {
            worker.getTaskData().state = ST_DELIVER;
        } else {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
        }
    }


    _doCollectEnergyState(worker) {
        if (doCollectEnergy(worker)) {
            worker.getTaskData().state = ST_DELIVER;
        }
    }


    _doDeliverState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() == 0) {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            return;
        }

        let targetId = this._m.memory.targetId;
        let target = Game.getObjectById(targetId);
        if (target) {
            if (target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
        }
    }


    setState(state) {
        this._m.memory = state;
    }


    update(worker) {
        let data = worker.getTaskData();
        data.state = data.state || 0;
        //console.log('[DeliverEnergyTask ' + this._m.memory.id + '] ' + worker.getId() + ' state ' + worker.getTaskData().state);
        switch(data.state) {
            case ST_INIT:
                this._doInitState(worker);
                break;
            case ST_COLLECT_ENERGY:
                this._doCollectEnergyState(worker);
                break;
            case ST_DELIVER:
                this._doDeliverState(worker);
                break;
            default:
                console.log('Warning: unknown state ' + data.state);
                data.state = ST_INIT;
                break;
        }
    }
}

Task.TYPE = 'deliver-energy';
module.exports = Task;