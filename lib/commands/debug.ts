import Command from '../command';
import Utils from '../utils';
import Project from '../project';
import System from '../system';
import BuildConfig from '../buildconfig';

export default class DebugCommand extends Command {

    public install(): void {
        this.program
            .command('debug')
            .description('Do debug stuff')
            // .option('-p, --path', 'Only get the path')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        const project = await Project.load(this.program);
        if (project) {
            console.log(project.getData());
        } else {
            console.log("No project found");
        }

        console.log("User path", System.getUserDirectory());
        console.log("Game User path", System.getGameUserDirectory());
        console.log("Windows", System.isWindows());
        console.log("Mac", System.isMacOS());

        const config = BuildConfig.load();
        if (config) {
            console.log(config.getData());
        } else {
            console.log("No config found");
        }

        console.log("install", System.getDefaultInstallationPath())
        console.log("installations", System.getInstallationPaths())
    }
}
