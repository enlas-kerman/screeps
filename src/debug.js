

Memory.debug = Memory.debug || {};
Memory.debug.tasksVisible = typeof(Memory.debug.tasksVisible) == 'undefined' ? false : Memory.debug.tasksVisible;
Memory.debug.debugVisible = typeof(Memory.debug.debugVisible) == 'undefined' ? false : Memory.debug.debugVisible;


module.exports = {

    isTaskRangeVisible: function() {
        return Memory.debug.tasksVisible;
    },

    setTaskRangeVisible: function(visible) {
        Memory.debug.tasksVisible = visible;
    },

    setDebugVisible: function(visible) {
        Memory.debug.debugVisible = visible;
    },

    isDebugVisible: function() {
        return Memory.debug.debugVisible;
    }
}