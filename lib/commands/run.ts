import Command from '../command';

export default class RunCommand extends Command {

    public install(): void {
        this.program
            .command('run')
            .description('Run Farming Simulator')
            .option('-s, --savegame <savegameId>', 'Start directly into a savegame.')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        console.log("Run FS");

        /*

        - Find FS installation, or use configured one
            - from build config in ~ or dir of file

        - Set FS options, if needed
        - Run
        - After run is done, unset FS options, if needed

         */
    }
}
