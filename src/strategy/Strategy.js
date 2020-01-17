


module.exports = function() {

    return {

        plan: function(tasks, workers) {
            console.log('Strategy: updating plan');
        },

        assign: function(tasks, workers) {
            console.log('Strategy: begin assigning tasks to workers.');

            // initially implement a simple strategy
            // repair the roads (up to 2 workers)
            // fill the spawn (up to 3 workers)
            // upgrade the controller (as many as available)

            console.log("Total assigned workers to road repairs: " + tasks.getTotalNumberAssigned('repair road'));

            let unassigned = workers.getUnassignedWorkers();
            console.log("Available workers: " + unassigned.length);

            let pending = Object.values(tasks.getPendingTasks('repair road'));
            console.log('Pending tasks: ' + pending.length);
            pending.forEach((task) => {
                if (unassigned.length == 0) {
                    return false;
                }

                let worker = unassigned.shift();

                console.log('  assigning ' + worker.id + ' to task ' + task.id);
                task.assignedWorkers[worker.id] = worker.id;
                worker.assignedTaskId = task.id;
            });
        }

    }

}