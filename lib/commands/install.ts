import Command from '../command';
import Utils from '../utils';
import Project from '../project';
import BuildConfig from '../buildconfig';
import System from '../system';
import BuildCommand from './build';

import * as fs from 'fs';
import * as path from 'path';
import * as logger from 'winston';
import * as util from 'util';

export default class InstallCommand extends Command {
    public project: Project;
    public config: BuildConfig;

    public install(): void {
        this.program
            .command('install')
            .description('Install the mod into the mods folder')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        const project = await Project.load(this.program);

        logger.info("Installing mod '" + project.get("name") + "'");

        this.project = project;
        this.config = BuildConfig.load();

        return this.doInstall()
    }

    private async doInstall(): Promise<void> {
        if (!this.isBuilt()) {
            logger.info("Build not found. Building...");

            const buildCommand = <BuildCommand>this.app.getCommand("BuildCommand");
            if (!buildCommand) {
                throw 'Failed to create required build';
            }

            await buildCommand.run([]);
        }

        // Find mods folder
        const fsFolder = this.config.get('fs_folder', System.getGameUserDirectory());
        const modsFolder = path.join(fsFolder, '/mods/');

        // Copy the file
        const zipName = this.project.zipName();

        return util.promisify(fs.copyFile)(this.project.filePath(zipName), path.join(modsFolder, zipName));
    }

    private isBuilt(): boolean {
        return fs.existsSync(this.project.filePath(this.project.zipName()));
    }
}
