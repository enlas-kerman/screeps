
const TASK_UPGRADE_CONTROL_POINT = 'upgrade control point';
const TASK_FILL_SPAWN_ENERGY = 'fill spawn energy';
const TASK_FILL_EXTENSION_ENERGY = 'fill ext energy';
const TASK_REPAIR_ROAD = 'repair road';
const TASK_BUILD = 'build';

Memory.tasks = Memory.tasks || {};
Memory.tasks.pending = Memory.tasks.pending || {};
Memory.tasks.terminated = Memory.tasks.terminated || {};
Memory.tasks.pending[TASK_BUILD] = Memory.tasks.pending[TASK_BUILD] || {};
Memory.tasks.terminated[TASK_BUILD] = Memory.tasks.terminated[TASK_BUILD] || {};


module.exports = {


    BuildTasks: function() {

        return {

            analyze: function(room) {
                let sites = room.find(FIND_MY_CONSTRUCTION_SITES);

                // for each construction site
                // determine if a task already exists for building it
                // if not, create a task
                let currentTasks = Memory.tasks.pending[TASK_BUILD];
                let updatedTasks = {};
                sites.forEach((site) => {
                    if (currentTasks[site.id]) {
                        updatedTasks[site.id] = currentTasks[site.id];
                    } else {
                        updatedTasks[site.id] = {
                            id: 'build-' + site.id,
                            taskType: TASK_BUILD,
                            siteId: site.id,
                            baseScore: 1,
                            assignedWorkers: {}
                        }
                    }
                });
        
                // whatever task not copied from current to updated must have been finished or cancelled
                // later, we'll need to reassign any assigned workers to these tasks
                let terminatedTasks = {};
                for (let siteId in currentTasks) {
                    if (!updatedTasks[siteId]) {
                        terminatedTasks[siteId] = currentTasks[siteId];
                    }
                }
        
                Memory.tasks.pending[TASK_BUILD] = updatedTasks;
                Memory.tasks.terminated[TASK_BUILD] = terminatedTasks;
            },

            getNumberPending: function() {
                return Object.keys(Memory.tasks.pending[TASK_BUILD]).length;
            },

            getNumberTerminated: function() {
                return Object.keys(Memory.tasks.terminated[TASK_BUILD]).length;
            }
        }

    },


    BuildTask: function(taskId) {

        return {

        }
    }



}