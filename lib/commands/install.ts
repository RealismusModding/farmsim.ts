import { Command } from '../command';

export default class InstallCommand extends Command {

    public install(): void {
        this.program
            .command('install')
            .description('Install the mod into the mods folder')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        console.log("Install the mod");

        /*

        - If needed, build:
          - if zip does not exist
          - if zip does exist but the files that matter are older

        - Find mods folder of installation, or use config

        - Copy ZIP to that folder
          - not update, so find local ZIP file. if it does not exist, do build.

         */
    }
}
