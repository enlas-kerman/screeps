
const ST_INIT = 0;
const ST_COLLECT_ENERGY = 1;
const ST_UPGRADE = 2;



const findBestEnergySource = (room, worker) => {

    let creep = worker.getCreep();

    if (worker.getTaskData().useContainer) {
        let containers = room.find(FIND_STRUCTURES, {
            filter: (s) => {
                return (s.structureType == STRUCTURE_CONTAINER) && (s.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity());
            }
        });

        if (containers.length > 0) {
            return containers[0];
        }
    }


    let costs = new PathFinder.CostMatrix;
    room.find(FIND_CREEPS).forEach((creep) => {
        costs.set(creep.pos.x, creep.pos.y, 0xff);
    });

    let minCost = 1000000;
    let minCostSource = null;
    room.find(FIND_SOURCES).forEach((source) => {
        let ret = PathFinder.search(creep.pos, [{ pos: source.pos, range: 1}], {
            plainCost: 1,
            swampCost: 5,
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


    _doInitState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() > 10) {
            worker.getTaskData().state = ST_UPGRADE;
        } else {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            worker.getTaskData().useContainer = true;
        }
    }


    _doCollectEnergyState(worker) {
        let creep = worker.getCreep();
        let data = worker.getTaskData();
        if (creep.store.getFreeCapacity() > 0) {
            let source = findBestEnergySource(creep.room, worker);
            if (source) {
                if (source.structureType) {
                    if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                } else {
                    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    } else {
                        data.useContainer = false;
                    }
                }
            }
        } else {
            data.state = ST_UPGRADE;
        }
    }


    _doUpgradeState(worker) {
        let creep = worker.getCreep();
        if (creep.store.getUsedCapacity() == 0) {
            worker.getTaskData().state = ST_COLLECT_ENERGY;
            worker.getTaskData().useContainer = true;
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
