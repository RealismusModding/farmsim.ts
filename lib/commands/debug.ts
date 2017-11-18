import Command from '../command';

import Project from '../project';
import System from '../system';
import BuildConfig from '../buildconfig';

import * as fs from 'fs';

export default class DebugCommand extends Command {

    public install(): void {
        this.program
            .command('debug')
            .description('Do debug stuff')
            // .option('-p, --path', 'Only get the path')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        // const project = Project.load(this.program);
        // if (!project) {
        //     return;
        // }

        // console.log(project.getData());


        console.log("User path", System.getUserDirectory());
        console.log("Game User path", System.getGameUserDirectory());
        console.log("Windows", System.isWindows());
        console.log("Mac", System.isMacOS());

        console.log(fs.readdirSync(System.getGameUserDirectory()));
    }
}
