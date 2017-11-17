import { Command } from '../command';

export default class LogCommand extends Command {

    public install(): void {
        this.program
            .command('log')
            .description('Read or get the log file')
            .option('-p, --path', 'Only get the path')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        // Find the path of the log file

        if (options.path) {
            console.log("write path of log file")

            // Write the path
        } else {
            console.log("Read log file");

            // Write the contents of the file
        }
    }
}
