let UpgradeControllerTask = require('task_UpgradeControllerTask');


module.exports = function() {
    

    return {

        analyze: function(room, tasks) {
            console.log('analyzing control point upgrade requirements');

            let pending = tasks.getByType(UpgradeControllerTask.TYPE);
            let task = pending.length > 0 ? pending[0] : tasks.addTask({
                id: 'upgrade-controller-' + room.name,
                type: UpgradeControllerTask.TYPE,
                roomId: room.name,
                score: 1,
                minWorkers: 100,
                maxWorkers: 100
            });

            if (room.controller.ticksToDowngrade < 10000) {
                task.score = 100;
            }

        }
    
    }
}

