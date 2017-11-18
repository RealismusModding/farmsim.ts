import Command from '../command';

export default class InitCommand extends Command {

    public install(): void {
        this.program
            .command('init [name]')
            .description('Initialize a new mod')
            .option('-t, --template <template>', 'Use a mod template.')
            .option('-T, --translations', 'Translations in separate XML files.')
            .option('-S, --scripts', 'Add a loader script for scripted mods.')
            .action((...args) => this.run.apply(this, args));
    }

    public run(name: string | null, options: any): void {
        console.log("Create a new mod");

        if (name) {
            console.log("Make folder, if not exists:", name);
        } else {
            console.log("Build in current folder, if not already a farmsim.yml file");
        }

        /*

        -- Create .gitignore

        -- If a valid template (geo), set options automatically

        -- If -T
        --   Create translations/translation_en.xml
        --   Add to modDesc

        -- If -S
        --   Create src/loader.lua
        --   Add to modDesc

        -- Create farmsim.yml
        -- Create modDesc.xml

         */
    }
}
