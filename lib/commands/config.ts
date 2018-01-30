import Command from '../command';
import Utils from '../utils';
import Project from '../project';
import System from '../system';
import BuildConfig from '../buildconfig';

import * as path from 'path';
import * as fs from 'fs';
import * as logger from 'winston';
import * as _ from 'lodash';
import * as yaml from 'js-yaml';
import { promisify } from 'util';

export default class ConfigCommand extends Command {

    public install(): void {
        this.program
            .command('config <action> <value>')
            .description('Set or get local build config options')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(action: string, arg2: string, options: any) {
        let project = await Project.load(this.program);
        const config = BuildConfig.load();

        const templates = Utils.getTemplates(project, config);

        if (action === 'get') {
            const value = config.get('templates.' + arg2);
            if (value) {
                console.log(value);
            }
        } else if (action === 'set') {
            const spl = arg2.split('=').map(_.trim);
            if (spl.length !== 2) {
                throw 'Last argument needs format "name=value"';
            }

            let val: any = spl[1];
            if (val.toLowerCase() === 'true') {
                val = true;
            } else if (val.toLowerCase() === 'false') {
                val = false;
            }

            const nVal = parseInt(val);
            if (!isNaN(nVal)) {
                val = nVal;
            }

            await this.updateConfig((data: any) => _.set(data, 'templates.' + spl[0], val));
        } else if (action === 'unset') {
            await this.updateConfig((data: any) => _.unset(data, 'templates.' + arg2));
        } else {
            throw 'Unknown action \'' + action + '\'';
        }
    }

    private async updateConfig(effect: (data: any) => void) {
        const p = path.join(process.cwd(), '.fsbuild.yml');

        let data = {};

        if (await promisify(fs.exists)(p)) {
            const contents = await promisify(fs.readFile)(p, 'utf-8');
            data = yaml.safeLoad(contents);
        }

        effect(data);

        return promisify(fs.writeFile)(p, yaml.safeDump(data));
    }
}
