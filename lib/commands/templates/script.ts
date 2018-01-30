import Template from './template';

import * as _ from 'lodash';
import * as inquirer from 'inquirer';

export default class ScriptTemplate extends Template {
    private answers: inquirer.Answers;

    constructor() {
        super('Script', 'script');
    }

    farmsim(data: any) {
        data['code'] = 'src/';
        data['main'] = this.answers.entry;
        data['type'] = 'script';
    }

    moddesc(data: any) {
        _.set(data, 'modDesc.extraSourceFiles.sourceFile.$.filename', this.answers.entry);
    }

    requiredFolders(): string[] {
        return [ 'src' ];
    }

    async init() {
        const questions = [
            {
                type: 'input',
                name: 'entry',
                message: 'Main script',
                default: 'src/loader.lua',
                validate: (v: string) => v.endsWith('.lua')
            }
        ];
        this.answers = await inquirer.prompt(questions);
    }
}
