const ST_INIT = 0;
const ST_COLLECT_ENERGY = 1;
const ST_BUILD = 2;


const findBestEnergySource = (room, creep) => {

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
};



const Task = class {

    constructor() {
        this._m = {};
    }

    _doInitState (worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() > 30) {
            worker.getTaskData().state = ST_BUILD;
        } else {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
        }
    }


    _doCollectEnergyState(worker) {
        let creep = worker.getCreep();
        let data = worker.getTaskData();
        if (creep.store.getFreeCapacity() > 0) {
            let source = findBestEnergySource(creep.room, creep);
            if (source) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        } else {
            data.state = ST_BUILD;
        }
    }


    _doBuildState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() == 0) {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            return;
        }
        let siteId = this._m.memory.siteId;
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
        console.log('[BuildTask ' + this._m.memory.id + '] ' + worker.getId() + ' state ' + worker.getTaskData().state);
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