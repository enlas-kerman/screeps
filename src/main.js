
let { Creeps } = require('controller_Creeps');
let { Towers } = require('controller_Towers');


module.exports.loop = () => {
   
    let creeps = new Creeps(Game, Memory);
    creeps.update();
    
    let towers = new Towers(Game, Memory);
    towers.update();
}