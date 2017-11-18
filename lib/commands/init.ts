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

/*

console.log("moddesc", JSON.stringify(modDesc, null, 2))

    // <extraSourceFiles>
    //     <sourceFile filename="src/registerSpruceTrees.lua" />
    // </extraSourceFiles>



        const codePath = project.get('code');
        if (codePath) {
            console.log("Code path", codePath);
        }

        const main = project.get('main');
        if (main) {
            console.log("main", main);
        }

        if (project.get('translations')) {
            _.set(modDesc, 'modDesc.l10n', [{
                "$": {
                    "filenamePrefix": "translations/translation"
                }
            }]);
        }



 */

/*

# .gitignore

.fsbuild*
*.zip
.DS_Store

 */
