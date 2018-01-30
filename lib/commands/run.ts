import Command from '../command';
import System from '../system';
import Utils from '../utils';

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as _ from 'lodash';
import * as logger from 'winston';
import * as util from 'util';

export default class RunCommand extends Command {

    public install(): void {
        this.program
            .command('run')
            .description('Run Farming Simulator')
            .option('-s, --savegame <savegameId>', 'Start directly into a savegame.', parseInt)
            // .option('-i, --installation <name>', 'Start a specific configured installation.')
            .option('-w, --warnings', 'Enable development warnings.')
            .option('-c, --no-cheats', 'Disable cheats.')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        const installation = System.getDefaultInstallationPath();
        if (!installation) {
            throw "No Farming Simulator installation found.";
        }

        logger.info(`Found installation at ${installation}.`)

        const type = System.getInstallationType(installation);

        if (type === 'app') {
            const launchXMLPath = path.resolve(installation, 'Contents', 'Resources', 'launch.xml');
            if (!fs.existsSync(launchXMLPath)) {
                throw "Installation is corrupt: can't find launch.xml.";
            }

            const args = this.createLaunchArgs(options);

            let launchData = {
                startup: {
                    cmdline: [ 'FarmingSimulator2017Game -name FarmingSimulator2017 ' + args.join(' ') ]
                }
            };
            this.writeXML(launchXMLPath, launchData);

            this.launch(installation);
        } else if (type === 'exe') {
            const args = this.createLaunchArgs(options);

            this.launch(installation, args);
        } else {
            this.launch(installation);
        }
    }

    private createLaunchArgs(options: any): string[] {
        const args = [];

        if (options.savegame) {
            args.push('-autoStartSavegameId', options.savegame.toString());
        }

        if (options.warnings) {
            args.push('-devWarnings');
        }

        if (!options.noCheats) {
            args.push('-cheats');
        }

        return args;
    }

    private launch(path: string, extraArgs?: string[]): void {
        const options = {
        };

        let args: string[] = [];
        let program: string;

        if (System.isMacOS()) {
            program = 'open';
            args = [ '-a', path ];

            args = args.concat(extraArgs || []);

            child_process.spawn(program, args)
                .on('error', logger.error);
        } else {
            program = path;
            args = extraArgs || [];

            child_process.execFile(path, args);
        }
    }

    private writeXML(path: string, data: any): boolean {
        let builder = new xml2js.Builder();
        let xml = builder.buildObject(data);

        fs.writeFileSync(path, xml, { encoding: 'utf8' });

        return true;
    }
}
