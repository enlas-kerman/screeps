const ST_INIT = 0;
const ST_HARVEST = 1;



const Task = class {

    constructor() {
        this.memory = null;
    }


    _doInitState(worker) {
        let data = worker.getTaskData();
        data.state = ST_HARVEST;
    }


    _doHarvestState(worker) {
        // move to the container
        let container = Game.getObjectById(this.memory.targetId);
        if (!container) {
            return;
        }

        let creep = worker.getCreep();
        if (!creep.pos.isEqualTo(container)) {
            creep.moveTo(container);
        } else {

            if (creep.store.getFreeCapacity() == 0) {
                creep.transfer(container, RESOURCE_ENERGY);
            } else {
                let source = creep.pos.findClosestByRange(FIND_SOURCES);
                creep.harvest(source);
            }
        }
    }


    setState(state) {
        this.memory = state;
    }

    update(worker) {
        let data = worker.getTaskData();
        if (!data) {
            console.log("Warning: clearing data for task " + this.memory.id);
            worker.clearTaskData();
        }
        data.state = data.state || 0;
        console.log('[Harvesting ' + worker.getAssignedTaskId() + '] updating ' + worker.getId() + ',' + data.state);
        switch(data.state) {
            case ST_INIT:
                this._doInitState(worker);
                break;
            case ST_HARVEST:
                this._doHarvestState(worker);
                break;
            default:
                console.log('Warning: unknown state ' + data.state);
                data.state = ST_INIT;
                break;
        }
    }

}

Task.TYPE = 'harvesting';
module.exports = Task;