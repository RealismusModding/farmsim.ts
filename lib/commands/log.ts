import Command from '../command';
import System from '../system';
import * as path from 'path';
import * as fs from 'fs';

export default class LogCommand extends Command {

    public install(): void {
        this.program
            .command('log')
            .description('Read or get the log file')
            .option('-p, --path', 'Only get the path')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        const logPath = path.resolve(System.getGameUserDirectory(), 'log.txt');

        if (options.path) {
            console.log(logPath);
        } else if (fs.existsSync(logPath)) {
            const logFile = fs.createReadStream(logPath);
            logFile.pipe(process.stdout);
        }
    }
}
