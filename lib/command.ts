import * as commander from 'commander';

interface CommandInterface {
    install(): void;

    run(): void;
}

export abstract class Command implements CommandInterface {

    constructor(protected program: commander.CommanderStatic) {
    }
}
