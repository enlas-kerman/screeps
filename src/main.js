let { Creeps } = require('controller_Creeps');
let { Towers } = require('controller_Towers');
let Supervisor = require('supervisor_Supervisor');

var me = this;

module.exports.loop = () => {
   
    // let creeps = new Creeps(Game, Memory);
    // creeps.update();
    
    let towers = new Towers(Game, Memory);
    towers.update();

    let supervisor = new Supervisor('W11N45');
    supervisor.update();
    me.supervisor = supervisor;
}


me.purge = () => {
    me.supervisor.purge();
}


me.worker = (id) => {
    let workerId = '|' + id + '|';
    let worker = me.supervisor.workers.getWorkerById(workerId);
    console.log('Worker:' + worker.id);
    console.log('Assigned to: ' + worker.assignedTaskId);
    if (worker.taskData) {
        console.log('Present state: ' + worker.taskData.state);
    }
}


me.goals = () => {
    let goals = me.supervisor.strategy.describeGoals();
    goals.forEach((goal) => {
        console.log('GOAL [');
        console.log('         Name: ' + goal.name);
        console.log('  Description: ' + goal.description);
        console.log(']');
    })
}