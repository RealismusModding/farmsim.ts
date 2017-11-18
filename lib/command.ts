import * as commander from 'commander';

export default abstract class Command {

    constructor(protected program: commander.CommanderStatic) {
    }

    public abstract install(): void;
}
