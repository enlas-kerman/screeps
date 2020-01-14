
let Creeps = require('controller_Creeps');


module.exports.loop = () => {
   
    let creeps = new Creeps.Controller(Game, Memory);
    creeps.update();
    
}