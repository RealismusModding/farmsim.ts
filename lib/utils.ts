import Command from './command';
import * as logger from 'winston';

export default class Utils {
    public static commandRunnerWithErrors(command: (...args: any[]) => Promise<void>, target: Command) {
        return async (...args: any[]) => {
            try {
                await command.apply(target, args)
            } catch(e) {
                // console.log(chalk.red(e.stack))
                logger.error(e.stack)
                process.exitCode = 1
            }
        }
    }
}
