const ST_INIT = 0;
const ST_COLLECT_ENERGY = 1;
const ST_REPAIR = 2;


const Task = class {

    constructor() {
        this._m = {};
    }


    _findBestEnergySource(room, creep) {

        let costs = new PathFinder.CostMatrix;
        room.find(FIND_CREEPS).forEach((creep) => {
            costs.set(creep.pos.x, creep.pos.y, 0xff);
        });
    
        let minCost = 1000000;
        let minCostSource = null;
        room.find(FIND_SOURCES).forEach((source) => {
            let ret = PathFinder.search(creep.pos, [{ pos: source.pos, range: 1}], {
                plainCost: 2,
                swampCost: 10,
                roomCallback: () => {
                    return costs;
                }
            });
            if (!ret.incomplete && ret.cost <= minCost) {
                minCost = ret.cost;
                minCostSource = source;
            }
        });
    
        return minCostSource;
    }
    


    _doInitState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() > 10) {
            worker.getTaskData().state = ST_REPAIR;
        } else {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
        }
    }


    _doCollectEnergyState(worker) {
        let creep = worker.getCreep();
        let data = worker.getTaskData();
        if (creep.store.getFreeCapacity() > 0) {
            let source = this._findBestEnergySource(creep.room, creep);
            if (source) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        } else {
            data.state = ST_REPAIR;
        }
    }


    _doRepairState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() == 0) {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
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
