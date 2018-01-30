import Command from '../command';
import Utils from '../utils';
import Project from '../project';
import BuildConfig from '../buildconfig';
import System from '../system';

import * as fs from 'fs';
import * as path from 'path';
import * as logger from 'winston';
import * as util from 'util';
import * as inquirer from 'inquirer';

export default class UninstallCommand extends Command {
    private project: Project;
    private config: BuildConfig;

    public install(): void {
        this.program
            .command('uninstall')
            .description('Remove mod from mods folder')
            .option('-f, --force', 'Do not ask for confirmation.')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        this.project = await Project.load(this.program);
        this.config = BuildConfig.load();

        logger.info("Removing mod '" + this.project.get("name") + "' from mods folder");

        return this.uninstall(options.force);
    }

    private async uninstall(force: boolean): Promise<void> {
        const fsFolder = this.config.get('fs_folder', System.getGameUserDirectory());
        const zipPath = path.join(fsFolder, '/mods/', this.project.zipName());

        if (!fs.existsSync(zipPath)) {
            logger.error('No mod installation found at', zipPath);
            return;
        }

        if (!force) {
            const question = {
                type: 'confirm',
                name: 'uninstall',
                message: 'Are you sure you want to uninstall "' + this.project.get("name") + '?"',
                default: false
            };

            return inquirer.prompt([question]).then(answer => answer.uninstall && this.delete(zipPath));
        } else {
            return this.delete(zipPath);
        }
    }

    private async delete(path: string): Promise<void> {
        return util.promisify(fs.unlink)(path);
    }
}
