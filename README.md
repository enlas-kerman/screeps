# screeps

This project contains sample code for the Screeps multiplayer programming game.

https://screeps.com/

To use this code,

1. install nodejs 13.x or later appropriate for your OS
2. clone this project from github
3. cd screeps (the project root by default)
4. npm install
5. create .screeps.json (see below)
6. Run 'grunt' (no arguments) to build from the project root

This file includes a copy of the grunt-screeps plugin for Grunt.  This plugin can automatically upload files from a screeps source project to screeps.com as part of the build process.  The Gruntfile.js contained in this project uses the grunt-screeps plugin for this purpose but it can be updated to suit your build automation preferences.

To use the grunt-screeps plugin, add a file to the 'screeps' project root called ".screeps.json" with your account information.  Your screeps.com account information should always be kept secret, so **do NOT commit .screeps.json to your source control or share it with anybody else!**

    {
      "email": "",
      "password": "",
      "branch": "",
      "ptr": false
    }
