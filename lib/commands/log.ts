import Command from '../command';
import System from '../system';
import Utils from '../utils';

import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

export default class LogCommand extends Command {

    public install(): void {
        this.program
            .command('log')
            .description('Read or get the log file')
            .option('-p, --path', 'Only get the path')
            .option('-e, --edit', 'Open in editor')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        const logPath = path.resolve(System.getGameUserDirectory(), 'log.txt');

        if (options.path) {
            console.log(logPath);

            return;
        }

        const exists = util.promisify(fs.exists);
        const isFile = await exists(logPath);

        if (!isFile) {
            throw 'Log file does not exist at ' + logPath;
        }

        if (options.edit) {
            return System.openFileInEditor(logPath);
        }

        fs.createReadStream(logPath).pipe(process.stdout);
    }
}
