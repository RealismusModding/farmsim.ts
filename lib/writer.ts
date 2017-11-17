import { Command } from './command';

export class Writer extends Command {

    public install(): void {
        this.program
            .command('write <req> [message]')
            .description('say hello!')
            .option('-o, --option', 'some option')
            .action((...args) => this.run.apply(this, args));
    }

    public run(req: string, optional?: string): void {
        console.log("Some thing happened", req, optional);
    }

    public write(message: String = "Hello World!") {
        console.log(message);
    }
}
