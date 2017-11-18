import * as commander from 'commander';

export abstract class Command {

    constructor(protected program: commander.CommanderStatic) {
    }

    public abstract install(): void;
}
