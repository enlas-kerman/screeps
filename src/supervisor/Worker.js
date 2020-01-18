

module.exports = function() {


    return {
        
        setState: function(memory) {
            this.memory = memory;
        },

        getId: function() {
            return this.memory.id;
        },

        assignToTask: function (taskId) {
            this.memory.assignedTaskId = taskId;
            this.clearTaskData();
        },

        unassign: function() {
            this.memory.assignedTaskId = null;
        },

        getAssignedTaskId: function() {
            return this.memory.assignedTaskId;
        },

        getTaskData: function() {
            if (this.memory.taskData) {
                return this.memory.taskData;
            }
        },

        clearTaskData: function() {
            this.memory.taskData = {};
        },

        setTaskData: function(data) {
            this.memory.taskData = data;
        },


        getCreep: function() {
            return Game.creeps[this.memory.id];
        }

    }
    
}