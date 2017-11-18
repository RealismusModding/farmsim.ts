import Command from '../command';

export default class UninstallCommand extends Command {

    public install(): void {
        this.program
            .command('uninstall')
            .description('Remove mod from mods folder')
            .option('-f, --force', 'Do not ask for confirmation.')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
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
