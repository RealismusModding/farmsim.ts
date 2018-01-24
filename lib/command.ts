import * as commander from 'commander';
import { App } from './app';

export default abstract class Command {
    protected program: commander.CommanderStatic;

    constructor(protected app: App) {
        this.program = app.getProgram();
    }

    public abstract install(): void;
}
