import Command from '../command';
import Utils from '../utils';

export default class UninstallCommand extends Command {

    public install(): void {
        this.program
            .command('uninstall')
            .description('Remove mod from mods folder')
            .option('-f, --force', 'Do not ask for confirmation.')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        console.log("Remove mod");

        /*

        - Find mods folder
        - Find all files with zipname*.zip.
        - For each
            - if not -f, ask for confirmation
            - delete

         */
    }
}
