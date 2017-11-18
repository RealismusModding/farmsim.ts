import * as commander from 'commander';
import { Command } from './command';

import InitCommand from './commands/init';
import BuildCommand from './commands/build';
import InstallCommand from './commands/install';
import RunCommand from './commands/run';
import LogCommand from './commands/log';
import UninstallCommand from './commands/uninstall';

export class App {

    private program: commander.CommanderStatic;
    private package: any;
    private commands: Command[];

    constructor() {
        this.program = commander;
        this.package = require('../package.json');

        // Add all commands
        this.commands = [
            new InitCommand(this.program),
            new BuildCommand(this.program),
            new InstallCommand(this.program),
            new RunCommand(this.program),
            new LogCommand(this.program),
            new UninstallCommand(this.program)
        ];
    }

    public initialize() {
        this.program
            .version(this.package.version)
            .option('-f, --file <path>', 'Path to modfile')
            .option('-q, --quiet', 'Only print error and warning messages; all other output will be suppressed.');

        this.commands.forEach((command) => {
            command.install()
        });

        this.program.parse(process.argv);

        if (!process.argv.slice(2).length) {
            this.program.outputHelp();
        }
    }

}

let app = new App();
app.initialize();
