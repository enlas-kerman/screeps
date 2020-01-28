


_Memory = {
    W11N46: {
        RESOURCE_ENERGY: {
            desired: 50000,
            actual: 45000
        },
        RESOURCE_CATALYST: {
            desired: 120000,
            actual: 55000,       // desired - actual is the amount that can be purchased
            buyPriceLimit: 2.90  // the highest price willing to pay per unit
        },
        RESOURCE_UTRIUM: {
            desired: 100500,
            actual: 120500,
            sellPriceLimit: 1.20
        }
    }
}


const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    }


    analyze(room, tasks) {
        if (!room.terminal || Game.time % 30) {
            return;
        }

        let terminal = room.terminal;
        let market = Game.market;
        let orders = market.getAllOrders({
            resourceType: RESOURCE_CATALYST,
            type: ORDER_BUY
        });
        console.log('orders: ' + orders.length);
        for (var i=0; i < orders.length; i++) {
            let order = orders[i];
            console.log('Order[' + order.roomName + ']: ' + order.id);
            console.log('   Amount: ' + order.amount);
            console.log('    Price: ' + order.price);
            console.log('     Cost: ' + market.calcTransactionCost(1000, room.name, order.roomName));
        }

        // best order
        // maximize: amount * price - (energy * 0.03)  where price is >= sell limit price
        // if not enough energy, put out a tasker for energy until energy is sufficient
        // if enough energy, make the sale
    }


}


module.exports = Goal;