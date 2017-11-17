import { Command } from '../command';

export default class Writer extends Command {

    public install(): void {
        this.program
            .command('write [message]')
            .description('say hello!')
            .option('-O, --output', 'some option')
            .action((...args) => this.run.apply(this, args));
    }

    public run(message: string = "Hello World!", options: any): void {
        console.log(message);

        if (options.output) {
            console.log("OUTPUT");
        }

        console.log(this.program.file);
    }
}
