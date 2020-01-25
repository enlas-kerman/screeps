const { Towers } = require('controller_Towers');
const Supervisor = require('supervisor_Supervisor');
const Debug = require('debug');

let me = this;

const MAX_WORKERS = 11;

const getMaxWorkers = (roomName) => {
    if (roomName == 'W11N45') {
        return MAX_WORKERS;
    }
    return 4;
}


module.exports.loop = () => {
   
    let towers = new Towers(Game, Memory);
    towers.update();

    let supervisors = {};
    for (let roomName in Game.rooms) {
        if (Game.rooms[roomName].controller.my) {
            supervisors[roomName] = new Supervisor(roomName, getMaxWorkers(roomName));
        }
    }


    for (let roomName in supervisors) {
        let supervisor = supervisors[roomName];
        supervisor.update();
    }

    me.supervisor = supervisors['W11N45'];
    me.supervisors = supervisors;
}


me.purge = () => {
    for (let name in me.supervisors) {
        me.supervisors[name].purge();
    }
}


me.worker = (id) => {

    for (let name in me.supervisors) {
        let workerId = '|' + id + '|';
        let worker = me.supervisors[name].workers.getWorkerById(workerId);
        if (worker) {
            console.log('Worker:          ' + worker.id);
            console.log('Assigned to:     ' + worker.assignedTaskId);
            console.log('Room:            ' + name);
            if (worker.taskData) {
                console.log('Present state: ' + worker.taskData.state);
            }
            return;
        }
    }
}


me.goals = () => {
    for (let name in me.supervisors) {
        console.log('[' + name + ']----------------------');
        let goals = me.supervisors[name].strategy.describeGoals();
        goals.forEach((goal) => {
            console.log('GOAL [');
            console.log(' Name:        ' + goal.name);
            console.log(' Description: ' + goal.description);
            console.log(']');
        })
    }
}


me.showTasks = () => {
    Debug.setTaskRangeVisible(true);
}

me.hideTasks = () => {
    Debug.setTaskRangeVisible(false);
}

me.showDebug = () => {
    Debug.setDebugVisible(true);
}

me.hideDebug = () => {
    Debug.setDebugVisible(false);
}

me.pause = () => {
    me.supervisor.pause();
}

me.resume = () => {
    me.supervisor.resume();
}