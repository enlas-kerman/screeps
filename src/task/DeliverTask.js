const ST_INIT = 0;
const ST_COLLECT = 1;
const ST_DELIVER = 2;




const Task = class {

    constructor() {
        this._m = {};
    }


    _doInitState(worker) {
        let data = worker.getTaskData();
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() > 0.5 * creep.store.getCapacity()) {
            data.state = ST_DELIVER;
        } else {
            data.state = ST_COLLECT;
        }
    }


    _doCollectState(worker) {
        let task = this._m.memory;

        let source = Game.getObjectById(task.sourceId);
        if (!source || source.store.getUsedCapacity(task.resourceType) == 0) {
            return;
        }

        let creep = worker.getCreep();
        if (creep.store.getFreeCapacity() == 0) {
            worker.getTaskData().state = ST_DELIVER;
            return;
        }

        if (creep.withdraw(source, task.resourceType) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }

    }


    _doDeliverState(worker) {
        let task = this._m.memory;

        let creep = worker.getCreep();
        if (!creep || creep.store.getUsedCapacity() == 0) {
            worker.getTaskData().state = ST_COLLECT;
            return;
        }

        let destination = Game.getObjectById(task.targetId);
        if (!destination || destination.store.getFreeCapacity() == 0) {
            return;
        }

        for (let resourceName in creep.store) {
            if (creep.transfer(destination, resourceName) == ERR_NOT_IN_RANGE) {
                creep.moveTo(destination);
            }
        }
    }



    setState(state) {
        this._m.memory = state;
    }


    update(worker) {
        let data = worker.getTaskData();
        if (!data) {
            console.log("Warning: clearing data for task " + this.memory.id);
            worker.clearTaskData();
        }
        data.state = data.state || 0;
        console.log('[DeliverTask ' + this._m.memory.id + '] ' + worker.getId() + ' state ' + worker.getTaskData().state);
        switch(data.state) {
            case ST_INIT:
                this._doInitState(worker);
                break;
            case ST_COLLECT:
                this._doCollectState(worker);
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

Task.TYPE = "deliver";
module.exports = Task;