

Memory.debug = Memory.debug || {};
Memory.debug.tasksVisible = typeof(Memory.debug.tasksVisible) == 'undefined' ? false : Memory.debug.tasksVisible;


module.exports = {

    isTaskRangeVisible: function() {
        return Memory.debug.tasksVisible;
    },

    setTaskRangeVisible: function(visible) {
        Memory.debug.tasksVisible = visible;
    }

}