const Supervisor = require('supervisor_Supervisor');
const Tower = require('controller_Tower');
const Debug = require('debug');

let me = this;

const MAX_WORKERS = 9;

const getMaxWorkers = (roomName) => {
    if (roomName == 'W11N45' || roomName == 'W11N46') {
        return MAX_WORKERS;
    }
    return MAX_WORKERS;
}


module.exports.loop = () => {
   
    let supervisors = {};
    let towers = {};
    for (let roomName in Game.rooms) {
        if (Game.rooms[roomName].controller && Game.rooms[roomName].controller.my) {
            supervisors[roomName] = new Supervisor(roomName, getMaxWorkers(roomName));
            towers[roomName] = new Tower(roomName);
        }
    }

    for (let roomName in supervisors) {
        let supervisor = supervisors[roomName];
        supervisor.update();

        let tower = towers[roomName];
        tower.update();
    }

    me.supervisor = supervisors['W11N45'];
    me.supervisors = supervisors;
}


me.purge = (roomName) => {
    if (roomName) {
        me.supervisors[roomName].purge();
    } else {
        for (let name in me.supervisors) {
            me.supervisors[name].purge();
        }
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