import Command from '../command';
import Utils from '../utils';
import System from '../system';

import Template from './templates/template';
import GeoTemplate from './templates/geo';
import ScriptTemplate from './templates/script';

import * as logger from 'winston';
import * as inquirer from 'inquirer';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import * as xml2js from 'xml2js';

import * as request from 'request';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const templates = [
    new GeoTemplate(),
    new ScriptTemplate()
];

export default class InitCommand extends Command {
    private targetFolder: string;
    private answers: inquirer.Answers;

    public install(): void {
        this.program
            .command('init [name]')
            .description('Initialize a new mod')
            .option('-t, --template <template>', 'Use a mod template.')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(name: string | null, options: any) {
        if (!name) {
            name = path.basename(process.cwd());
            this.targetFolder = process.cwd();
        } else {
            this.targetFolder = path.join(process.cwd(), name);
        }

        if (this.pathExists('farmsim.yml')) {
            throw 'farmsim.yml already exists. Mod already configured.';
        }

        return this.init(name, options.template);
    }

    private async init(name: string, template: string | null) {
        // Ask a lot of questions
        const questions = [
            {
                type: 'input',
                name: 'name',
                message: 'Mod name',
                default: _.startCase(name)
            },
            {
                type: 'input',
                name: 'zip_name',
                message: 'ZIP name',
                default: name.startsWith('FS17_') ? name : 'FS17_' + name,
                validate: (val: string) => val.indexOf(".") === -1
            },
            {
                type: 'input',
                name: 'version',
                message: 'Version',
                default: '1.0.0.0',
                validate: (val: string) => {
                    const spl = val.split(".");
                    if (spl.length !== 4) {
                        return false;
                    }

                    return spl.map(_.ary(parseInt, 1)).filter(isNaN).length === 0;
                }
            },
            {
                type: 'input',
                name: 'author',
                message: 'Author',
                default: System.getUser() || false
            },
            {
                type: 'list',
                name: 'template',
                message: 'Mod template',
                choices: ['None'].concat(templates.map(v => v.title)),
                default: template == null ? false : templates.findIndex(v => v.name == template.toLowerCase()) + 1,
                filter: (val: string) => val.toLowerCase()
            },
            {
                type: 'confirm',
                name: 'translations',
                message: 'Add translations?',
                default: false
            }
        ];

        this.answers = await inquirer.prompt(questions);

        const templateObject = templates.find(t => t.name === this.answers.template) || null;

        if (templateObject) {
            templateObject.requiredFolders().forEach(f => this.ensureFolder(f));

            await templateObject.init();
        }

        // Make sure the mod folder exists
        await this.ensureFolder('.');

        // Base files
        await this.ensureGitignore();
        await this.ensureGitattributes();

        // Create farmsim.yml object
        await this.createFarmSim(templateObject);

        if (!this.pathExists('modDesc.xml')) {
            // Assume icon exists if moddesc is already available
            await this.ensureIcon();

            await this.createModDesc(templateObject);
        }
    }

    private async createFarmSim(template: Template | null) {
        const object: any = {
            'name': this.answers.name,
            'zip_name': this.answers.zip_name,
            'author': this.answers.author,
            'version': this.answers.version
        };

        if (this.answers.translations) {
            object['base_translation'] = 'en';
            object['translations'] = [ 'en' ];
        }

        if (template) {
            template.farmsim(object);
        }

        return this.writeFile('farmsim.yml', yaml.safeDump(object));
    }

    private async createModDesc(template: Template | null) {
        const builder = new xml2js.Builder();

        const object = {
            modDesc: {
                '$': {
                    descVersion: Utils.getLatestDescVer()
                },

                author: this.answers.author,
                contributors: '',
                version: this.answers.version,

                title: {
                    "en": this.answers.name
                },

                description: {
                    "en": "My new mod, created with 'farmsim' tool."
                },

                iconFilename: "icon.png",

                multiplayer: {
                    "$": {
                        "supported": true
                    }
                }
            }
        };

        if (this.answers.translations) {
            _.set(object, 'modDesc.l10n.$.filenamePrefix', 'translations/translation');
        }

        // Create moddesc.xml object
        if (template) {
            template.moddesc(object);
        }

        return this.writeFile('modDesc.xml', builder.buildObject(object));
    }

    private async ensureGitignore() {
        if (this.pathExists('.gitignore')) {
            return;
        }

        const contents = ".fsbuild*\n*.zip\n.DS_Store\n*.sublime-workspace\n*.sublime-project\n.idea/\n";

        return this.writeFile('.gitignore', contents);
    }

    private async ensureGitattributes() {
        if (this.pathExists('.gitattributes')) {
            return;
        }

        const contents = "*.xml   text eol=lf\n*.lua   text eol=lf\n";

        return this.writeFile('.gitattributes', contents);
    }

    private async ensureIcon() {
        if (this.pathExists('icon.dds')) {
            return;
        }

        const url = 'https://github.com/RealismusModding/farmsim.ts/raw/develop/resources/icon.dds';

        logger.info('Creating icon.dds');
        request(url).pipe(fs.createWriteStream(path.join(this.targetFolder, 'icon.dds')));
    }

    private async writeFile(subpath: string, contents: string) {
        logger.info('Writing file', subpath);
        return promisify(fs.writeFile)(path.join(this.targetFolder, subpath), contents);
    }

    private pathExists(subpath: string) {
        return fs.existsSync(path.join(this.targetFolder, subpath));
    }

    private async ensureFolder(subpath: string) {
        if (!this.pathExists(subpath)) {
            logger.info('Creating directory', subpath);
            return promisify(fs.mkdir)(path.join(this.targetFolder, subpath));
        }
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
