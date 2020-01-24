let { doCollectEnergy, resetEnergyAffinity } = require('task_CollectEnergy');

const ST_INIT = 0;
const ST_COLLECT_ENERGY = 1;
const ST_BUILD = 2;


const Task = class {

    constructor() {
        this._m = {};
    }

    _doInitState (worker) {
        let creep = worker.getCreep();
        for (let name in creep.store) {
            if (name !== RESOURCE_ENERGY) {
                creep.drop(name);
            }
        }
        if (creep.store.getUsedCapacity() > 30) {
            worker.getTaskData().state = ST_BUILD;
        } else {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            resetEnergyAffinity(worker);
        }
    }


    _doCollectEnergyState(worker) {
        if (doCollectEnergy(worker)) {
            worker.getTaskData().state = ST_BUILD;
        }
    }


    _doBuildState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() == 0) {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            resetEnergyAffinity(worker);
            return;
        }
        let siteId = this._m.memory.targetId;
        let site = Game.getObjectById(siteId);
        if (site) {
            if (creep.build(site) == ERR_NOT_IN_RANGE) {
                creep.moveTo(site);
            }
        }
    }


    setState(state) {
        this._m.memory = state;
    }


    update(worker) {
        let data = worker.getTaskData();
        data.state = data.state || 0;
        //console.log('[BuildTask ' + this._m.memory.id + '] ' + worker.getId() + ' state ' + worker.getTaskData().state);
        switch(data.state) {
            case ST_INIT:
                this._doInitState(worker);
                break;
            case ST_COLLECT_ENERGY:
                this._doCollectEnergyState(worker);
                break;
            case ST_BUILD:
                this._doBuildState(worker);
                break;
            default:
                console.log('Warning: unknown state ' + data.state);
                data.state = ST_INIT;
                break;
        }
    }

}


Task.TYPE = 'build';
module.exports = Task;