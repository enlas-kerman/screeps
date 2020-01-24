let { doCollectEnergy, resetEnergyAffinity } = require('task_CollectEnergy');

const ST_INIT = 0;
const ST_COLLECT_ENERGY = 1;
const ST_UPGRADE = 2;


const Task = class {

    constructor() {
        this._m = {};
    }


    dropResources(worker) {
        let creep = worker.getCreep();
        for (let name in creep.store) {
            if (name !== RESOURCE_ENERGY) {
                creep.drop(name);
            }
        }
    }


    _doInitState(worker) {
        let creep = worker.getCreep();
        this.dropResources(worker);
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 10) {
            worker.getTaskData().state = ST_UPGRADE;
        } else {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            resetEnergyAffinity(worker);
        }
    }


    _doCollectEnergyState(worker) {
        if (doCollectEnergy(worker)) {
            worker.getTaskData().state = ST_UPGRADE;
        }
    }


    _doUpgradeState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            resetEnergyAffinity(worker);
            return;
        }

        let controller = Game.rooms[this._m.memory.roomId].controller;
        if (controller) {
            if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(controller);
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
        //console.log('UpgradeControllerTask: ' + worker.getId() + ',' + data.state);
        switch(data.state) {
            case ST_INIT:
                this._doInitState(worker);
                break;
            case ST_COLLECT_ENERGY:
                this._doCollectEnergyState(worker);
                break;
            case ST_UPGRADE:
                this._doUpgradeState(worker);
                break;
            default:
                console.log('Warning: unknown state ' + data.state);
                data.state = ST_INIT;
                break;
        }
    }

}

Task.TYPE = 'upgrade';
module.exports = Task;
