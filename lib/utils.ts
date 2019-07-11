import Command from './command';
import Project from './project';
import BuildConfig from './buildconfig';

import * as logger from 'winston';
import * as fs from 'fs-extra';
import * as _ from 'lodash';

export default class Utils {
    public static commandRunnerWithErrors(command: (...args: any[]) => Promise<void>, target: Command) {
        return async (...args: any[]) => {
            try {
                await command.apply(target, args);
            } catch(e) {
                if (e.message) {
                    logger.error(e.message);
                    logger.error(e.stack);
                } else {
                    logger.error(e);
                }

                process.exitCode = 1;
            }
        };
    }

    public static async copy(src: string, dest: string, options?: fs.CopyOptions): Promise<void> {
        return fs.copy(src, dest, options);
    }

    public static removeFolder(dir: string): Promise<void> {
        return fs.remove(dir);
    }

    public static getLatestDescVer() {
        return 44;
    }

    public static getTemplates(project: Project, config: BuildConfig, release?: boolean): any {
        let templates = project.get('templates', {});

        if (release) {
            // Override with release templates
            templates = _.defaults(project.get('release.templates', {}), templates);
        } else {
            // Override with build config
            templates = _.defaults(config.get('templates', {}), templates);
        }

        return templates;
    }
}
