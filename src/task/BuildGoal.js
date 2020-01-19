let BuildTask = require('task_BuildTask');


const findConstructionSites = (room) => {
    let sites = Object.values(Game.constructionSites);
    return _.filter(sites, {room: room});
}



module.exports = class {

    constructor(goalId) {
        this.goalId = goalId;
    }

    analyze(room, tasks) {
        let pendingTasks = tasks.getByType(BuildTask.TYPE, {
            filter: {
                goal: this.goalId
            }
        });
        for (let i=0; i < pendingTasks.length; i++) {
            let task = pendingTasks[i];
            let site = Game.getObjectById(task.siteId);
            if (site == null) {
                tasks.terminate(task.id);
            }
        }

        let sites = findConstructionSites(room);
        for (let i=0; i < sites.length; i++) {
            let site = sites[i];
            let key = BuildTask.TYPE + '-' + site.id;
            if (!tasks.exists(key)) {
                tasks.addTask({
                    id: key,
                    type: BuildTask.TYPE,
                    goal: this.goalId,
                    siteId: site.id,
                    score: 10,
                    minWorkers: 3,
                    maxWorkers: 6,
                    assignedWorkers: {}
                });
            }
        }
    }



}