const DeliverTask = require('task_DeliverTask');
const DeliverEnergyTask = require('task_DeliverEnergyTask');


// _Memory = {
//     W11N46: {
//         RESOURCE_ENERGY: {
//             desired: 50000,
//             actual: 45000
//         },
//         RESOURCE_CATALYST: {
//             desired: 120000,
//             actual: 55000,       // desired - actual is the amount that can be purchased
//             buyPriceLimit: 2.90  // the highest price willing to pay per unit
//         },
//         RESOURCE_UTRIUM: {
//             desired: 100500,
//             actual: 120500,
//             sellPriceLimit: 1.20
//         }
//     }
// }


const Goal = class {

    constructor(goalId, memory) {
        this.goalId = goalId;
        this.memory = memory;
    }


    cleanupTasks(tasks, resourceId) {
        console.log('cleaning up inventory tasks for ' + resourceId);
        let deliverResourceKey = DeliverTask.TYPE + '-' + resourceId + '-' + '-to-terminal';
        if (tasks.exists(deliverResourceKey)) {
            console.log('removing task ' + deliverResourceKey);
            tasks.terminate(deliverResourceKey);
        }
    }


    analyzeResource(room, tasks, resourceType) {
        //console.log('Analyzing market for ' + resourceType);
        let maxSellLotSize = 2000;
        let resource = this.memory[resourceType];
        let { desired, sellLimit } = resource;
        let storage = room.storage;
        let terminal = room.terminal;
        let inStorage = storage.store.getUsedCapacity(resourceType);
        let inTerminal = terminal.store.getUsedCapacity(resourceType);
        
        if (resource.sellLimit) {

            let bestAsk = this.findTopBuyOrder(Game.market, {
                room: room,
                resourceType: resourceType,
                minPrice: sellLimit
            });
            if (bestAsk && bestAsk.price >= sellLimit) {  // if not, clear all tasks, because the trade cant be done
                console.log('best ask: ' + bestAsk.amount + ' @ ' + bestAsk.price);
                console.log('The asking price for ' + resourceType + ' is acceptable (ask: ' + bestAsk.price + ', limit: ' + sellLimit + ')');

                let totalUnitsAvailable = inStorage + inTerminal;
                let surplus = totalUnitsAvailable - desired;
                surplus = surplus >= 0 ? surplus : 0;
                let tradeAmount = Math.min(maxSellLotSize, bestAsk.amount, surplus);
                console.log('Total available is ' + totalUnitsAvailable + ' units.');
                console.log('Trade amount is ' + tradeAmount + ' units.');
                console.log('Surplus is ' + surplus);
                if (tradeAmount > 0 && surplus >= maxSellLotSize) {  // if not, clear all tasks, because there is not enough resources to trade right now
                    console.log('There is enough surplus of the resource in the room to make a trade: ' + surplus);
                    // if delivery task exists, then terminate it

                    let deliverResourceKey = DeliverTask.TYPE + '-' + resourceType + '-to-terminal';
                    if (inTerminal >= tradeAmount) {  // if not, create task to move resources from storage to terminal
                        console.log('There is enough resource in the terminal to make a trade: ' + inTerminal);
                        tasks.terminate(deliverResourceKey);

                        let deliverEnergyKey = DeliverEnergyTask.TYPE + '-' + room.name + '-terminal-energy';
                        let terminalEnergy = terminal.store.getUsedCapacity(RESOURCE_ENERGY);
                        let energyCost = bestAsk.unitEnergyCost * tradeAmount;
                        console.log('Energy cost: ' + energyCost + ',  bestAsk: ' + bestAsk + ',  tradeAmount: ' + tradeAmount);
                        if (terminalEnergy >= energyCost) { // if not, create task to deliver energy from source/container/tombstone/etc to terminal
                            console.log('There is enough energy in the terminal to make a trade: ' + terminalEnergy + ' > ' + energyCost);
                            tasks.terminate(deliverEnergyKey);

                            if (terminal.cooldown == 0) {  // if not, try again later
                                console.log('The terminal is ready to trade.');

                                // we can make the deal here if the terminal is ready and the order matches
                                let err = Game.market.deal(bestAsk.id, tradeAmount, room.name);
                                if (err == OK) {
                                    console.log('Trade executed.');
                                } else {
                                    console.log('Error while trading: ' + err);
                                }
                            }
                        } else {
                            if (!tasks.exists(deliverEnergyKey)) {
                                console.log('creating delivery for ' + deliverEnergyKey);
                                tasks.addTask({
                                    id: deliverEnergyKey,
                                    type: DeliverEnergyTask.TYPE,
                                    goal: this.goalId,
                                    targetId: terminal.id,
                                    useStorage: true,
                                    storageId: storage.id,
                                    score: 15,
                                    minWorkers: 1,
                                    maxWorkers: 1,
                                    assignedWorkers: {}
                                });
                            }

                        }
                    } else {
                        if (!tasks.exists(deliverResourceKey)) {
                            console.log('creating delivery task for ' + deliverResourceKey);
                            tasks.addTask({
                                id: deliverResourceKey,
                                type: DeliverTask.TYPE,
                                goal: this.goalId,
                                sourceId: storage.id,
                                targetId: terminal.id,
                                resourceType: resourceType,
                                score: 98,
                                minWorkers: 1,
                                maxWorkers: 1,
                                assignedWorkers: {}
                            });
                        }

                    }
                } else {
                    // terminate all delivery tasks because a trade isnt possible
                    let pending = Object.values(tasks.getAll());
                    pending = _.filter(pending, {goal: this.goalId});
                    pending.forEach((task) =>  {
                        tasks.terminate(task.id);
                    });
                }
            } else {
                // terminate all delivery tasks because a trade isnt possible
                let pending = Object.values(tasks.getAll());
                pending = _.filter(pending, {goal: this.goalId});
                pending.forEach((task) =>  {
                    tasks.terminate(task.id);
                });
            }
        }
    }


    analyze(room, tasks) {

        if (!room.terminal || !room.storage || Game.time % 3) {
            return;
        }

        for (let resourceType in this.memory) {
            this.analyzeResource(room, tasks, resourceType);
        }
    }


    getFromStore(target, resourceId) {
        return target.store.getUsedCapacity(resourceId);
    }


    findTopBuyOrder(market, options) {
        let { room, resourceType, minPrice } = options;
        let orders = market.getAllOrders((order) => {
            return order.resourceType == resourceType &&
                   order.type == ORDER_BUY &&
                   order.price >= minPrice;
        });

        if (orders.length == 0) {
            return null;
        }

        orders.forEach((order) => {
            order.unitEnergyCost = market.calcTransactionCost(100, room.name, order.roomName)/100;
            order.effPrice = Math.ceil((order.price - order.unitEnergyCost * 0.018) * 1000) / 1000;
        });

        
        // sort by net sale (price - cost of energy)
        orders.sort((a,b) => {
            return b.effPrice - a.effPrice;
        });

        return orders[0];
    }


}


module.exports = Goal;


this.Inv = {

    check: function(roomName, resourceId) {
        let room = Game.rooms[roomName];
        if (!room.terminal || !room.storage) {
            console.log('Invalid room or no terminal/storage available in room: ' + roomName);
            return false;
        }
        if (!Memory.rooms[roomName]) {
            console.log('Room market not initialized: ' + roomName);
            return false;
        }        
    },

    describe: function(roomName, resourceId) {
        this.check(roomName, resourceId);
        console.log('Room: ' + roomName);
        console.log('Resource: ' + resourceId);

        let room = Game.rooms[roomName];
        let { terminal, storage } = room;

        let memory = Memory.rooms[roomName].inv;
        if (!memory[resourceId]) {
            console.log('No inventory information found for resource: ' + resourceId);
            return false;
        }

        let resource = memory[resourceId];
        delete resource.actual; // DELETE THIS LINE
        
        let { desired, sellLimit } = resource;
        console.log('   Desired: ' + desired + ' units');
        console.log('   S/T/TOT: ' + storage.store.getUsedCapacity(resourceId) + ' / ' + terminal.store.getUsedCapacity(resourceId) + ' / ' + (storage.store.getUsedCapacity(resourceId) + terminal.store.getUsedCapacity(resourceId)) + ' units');
        console.log('Sell Limit: ' + sellLimit + ' credits');
        console.log('    Energy: ' + Game.rooms[roomName].terminal.store.getUsedCapacity(RESOURCE_ENERGY));        
       
    },


    update: function(roomName, resourceId, values) {
        this.check(roomName, resourceId);
        
        let memory = Memory.rooms[roomName].inv;
        memory[resourceId] = memory[resourceId] || {};
        let resource = memory[resourceId];
        if (values.desired) {
            resource.desired = values.desired;
        }
        if (values.sellLimit) {
            resource.sellLimit = values.sellLimit;
        }
    },


    remove: function(roomName, resourceId) {
        this.check(roomName, resourceId);
        let memory = Memory.rooms[roomName].inv;
        delete memory[resourceId]        ;
    }
}