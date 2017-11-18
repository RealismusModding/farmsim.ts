import Command from '../command';
import System from '../system';

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as _ from 'lodash';

export default class RunCommand extends Command {

    public install(): void {
        this.program
            .command('run')
            .description('Run Farming Simulator')
            .option('-s, --savegame <savegameId>', 'Start directly into a savegame.', parseInt)
            // .option('-i, --installation <name>', 'Start a specific configured installation.')
            .option('-w, --warnings', 'Enable development warnings.')
            .option('-c, --no-cheats', 'Disable cheats.')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        const installation = System.getDefaultInstallationPath();
        if (!installation) {
            console.error("No Farming Simulator installation found.");
            return;
        }
        console.log(`Found installation at ${installation}.`)

        const type = System.getInstallationType(installation);

        if (type === 'app') {
            const launchXMLPath = path.resolve(installation, 'Contents', 'Resources', 'launch.xml');
            if (!fs.existsSync(launchXMLPath)) {
                console.error("Installation is corrupt: can't find launch.xml.");
                return;
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
            encoding: 'utf8',
        };

        let args: string[] = [];
        let program: string;

        if (System.isMacOS) {
            program = 'open';
            args = [ '-a', path ];
        } else {
            program = 'start';
            args = [ path ];
        }

        args = args.concat(extraArgs || []);

        child_process.spawnSync(program, args, options);
    }

    private parseXML(path: string): any | null {
        const contents = fs.readFileSync(path, 'utf8');
        let data = null;

        xml2js.parseString(contents, (err, result) => {
            if (err) {
                console.error(err);
                return;
            }

            data = result;
        });

        return data;
    }

    private writeXML(path: string, data: any): boolean {
        let builder = new xml2js.Builder();
        let xml = builder.buildObject(data);

        fs.writeFileSync(path, xml, { encoding: 'utf8' });

        return true;
    }
}
