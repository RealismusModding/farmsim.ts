import * as commander from 'commander';
import { Command } from './command';

import { Writer } from './writer';

export class App {

    private program: commander.CommanderStatic;
    private package: any;
    private commands: Command[];

    constructor() {
        this.program = commander;
        this.package = require('../package.json');

        // Add all commands
        this.commands = [
            new Writer(this.program)
        ];
    }

    public initialize() {
        this.program.version(this.package.version);

        this.commands.forEach((command) => {
            command.install()
        });

        this.program.parse(process.argv);
    }

}

let app = new App();
app.initialize();
