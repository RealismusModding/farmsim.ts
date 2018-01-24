import Command from '../command';
import Utils from '../utils';
import Project from '../project';
import BuildConfig from '../buildconfig';
import System from '../system';

import * as logger from 'winston';

export default class VerifyCommand extends Command {
    public project: Project;
    public config: BuildConfig;

    public install(): void {
        this.program
            .command('verify')
            .description('Verify contents of the mod source.')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        const project = await Project.load(this.program);

        logger.info("Verifying mod '" + project.get("name") + "'");

        this.project = project;
        this.config = BuildConfig.load();

        return this.verify()
    }

    private async verify(): Promise<void> {

    }
}
