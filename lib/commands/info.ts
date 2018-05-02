import Command from '../command';
import Utils from '../utils';
import Project from '../project';
import System from '../system';
import BuildConfig from '../buildconfig';

import * as path from 'path';
import * as _ from 'lodash';
import chalk from 'chalk';

export default class InfoCommand extends Command {

    public install(): void {
        this.program
            .command('info')
            .description('Show project and build information')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any) {
        let project = await Project.load(this.program);
        const config = BuildConfig.load();

        const nl = () => console.log();
        const title = (text: string) => console.log(chalk.red(text.toUpperCase()));
        const value = (name: string, value: string) => console.log(chalk.blue(_.padEnd(_.startCase(name), 14)), chalk.grey('->'), value);

        title('project');
        value('name', project.get('name'));
        value('author', project.get('author'));
        value('version', project.get('version'));
        value('mod type', project.get('type', 'none'));
        nl();
        value('path', path.resolve(project.path));

        nl();
        if (config) {
            title('build configuration');

            value('User path', config.get('fs_folder'));
            value('Game paths', '');
            _.forEach(config.get('installations', {}), (p: string, name: string) => value('    ' + name, p))

            value('Servers', _.keys(config.get('servers', {})).join('; '))
        }

        nl();
        title('templates');
        const templates = Utils.getTemplates(project, config);
        _.forEach(templates, (val: string, name: string) => value(name, val))

        nl();
        title('system info');

        await System.getInstallationPaths().then((data: string[]) => {
                value('Game paths', data.join('; '));
            }
        );

        value('User path', System.getUserDirectory());
        value('Game user path', System.getGameUserDirectory());
        value('Platform', System.isWindows() ? 'Windows' : System.isMacOS() ? 'Mac' : 'Other');
    }
}
