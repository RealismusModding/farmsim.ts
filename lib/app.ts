import * as commander from 'commander';
import { Command } from './command';

import Writer from './commands/writer';
import InitCommand from './commands/init';

export class App {

    private program: commander.CommanderStatic;
    private package: any;
    private commands: Command[];

    constructor() {
        this.program = commander;
        this.package = require('../package.json');

        // Add all commands
        this.commands = [
            new Writer(this.program),
            new InitCommand(this.program)
        ];
    }

    public initialize() {
        this.program
            .version(this.package.version)
            .option('-f, --file <path>', 'Path to modfile');
            // .option('-q, --quiet', 'Only print error and warning messages; all other output will be suppressed.');

        this.commands.forEach((command) => {
            command.install()
        });

        this.program.parse(process.argv);
    }

}

let app = new App();
app.initialize();
