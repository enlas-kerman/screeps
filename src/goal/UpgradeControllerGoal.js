let UpgradeControllerTask = require('task_UpgradeControllerTask');

const Goal = class {

    constructor(goalId) {
        this.goalId = goalId;
    };


    analyze(room, tasks) {
        let pending = tasks.getByType(UpgradeControllerTask.TYPE);
        let task = pending.length > 0 ? pending[0] : tasks.addTask({
            id: 'upgrade-controller-' + room.name,
            type: UpgradeControllerTask.TYPE,
            goal: this.goalId,
            roomId: room.name,
            targetId: room.controller.id,
            score: 1,
            minWorkers: 100,
            maxWorkers: 100
        });

        if (room.controller.ticksToDowngrade < 2000) {
            task.score = 100;
        } else {
            if (room.controller.ticksToDowngrade > 3000) {
                task.score = 1;
            }
        }

    }

}

module.exports = Goal;
