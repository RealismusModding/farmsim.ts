import * as commander from 'commander';
import logger = require('winston');

import Command from './command';

import InitCommand from './commands/init';
import BuildCommand from './commands/build';
import InstallCommand from './commands/install';
import RunCommand from './commands/run';
import LogCommand from './commands/log';
import UninstallCommand from './commands/uninstall';
import VerifyCommand from './commands/verify';
import InfoCommand from './commands/info';

export class App {
    private program: commander.CommanderStatic;
    private package: any;
    private commands: Command[];

    constructor() {
        this.program = commander;
        this.package = require('../package.json');

        // Add all commands
        this.commands = [
            new InitCommand(this),
            new BuildCommand(this),
            new InstallCommand(this),
            new RunCommand(this),
            new LogCommand(this),
            new UninstallCommand(this),
            new VerifyCommand(this),
            new InfoCommand(this),
        ];
    }

    public initialize() {
        logger.remove(logger.transports.Console)
        logger.add(logger.transports.Console, {
            colorize: true
        })
        logger.level = 'debug'

        this.program
            .version(this.package.version)
            .option('--file <path>', 'Path to modfile')
            .option('-q, --quiet', 'Only print error and warning messages; all other output will be suppressed.');

        this.commands.forEach((command) => {
            command.install()
        });

        this.program.parse(process.argv);

        if (!process.argv.slice(2).length) {
            this.program.outputHelp();
        }
    }

    public getProgram(): commander.CommanderStatic {
        return this.program;
    }

    public getCommand(name: string): Command | undefined {
        return this.commands.find(c => c.constructor.name === name);
    }
}

let app = new App();
app.initialize();
