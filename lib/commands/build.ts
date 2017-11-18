import Command from '../command';

export default class BuildCommand extends Command {

    public install(): void {
        this.program
            .command('build')
            .description('Build the mod')
            .option('-r, --release', 'Create a release build')
            .option('-u, --update', 'Create an update build')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        console.log("Build mod");

        /*

        Note: put all of this in a separate lib, so it can be re-used by install too, and to
        create variations of the build process.

        - Load project
        - Load build config

        - Create temp folder
        - Read modDesc, fill values, write modDesc
        - Read source files, fill values, write source files
        - Copy any resources (non-excluded+non-source files files)

        - Turn temp folder into a proper ZIP.
        - Remove temp folder


        Note: If Release build:
        - If specified in project.yml: Verify translations are not missing, throw warnings and remove empty translations
        - Disable local build config, only use from farmsim.yaml, and use its release data if available

        If update build:
        - Do release build
        - Append zip name with _update

         */
    }
}
