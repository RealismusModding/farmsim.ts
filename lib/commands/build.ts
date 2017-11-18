import Command from '../command';
import Project from '../project';
import BuildConfig from '../buildconfig';
import System from '../system';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as _ from 'lodash';

export default class BuildCommand extends Command {
    private static LATEST_MODDESC_VER: number = 38;

    private targetFolder: string | null;
    public project: Project;
    public config: BuildConfig;

    public install(): void {
        this.program
            .command('build')
            .description('Build the mod')
            .option('-r, --release', 'Create a release build')
            .option('-u, --update', 'Create an update build')
            .action((...args) => this.run.apply(this, args));
    }

    public run(options: any): void {
        console.log("Build mod");

        const project = Project.load(this.program);
        if (!project) {
            console.error("Not a farmsim project.");
            return;
        }

        this.project = project;
        this.config = BuildConfig.load();

        this.build(options.release || options.update, options.update);
    }

    public build(release: boolean, update: boolean): void {
        // Catch all issues to not end up with gigabytes of failed builds
        try {
            // this.targetFolder = fs.mkdtempSync('.fsbuild-');
            this.targetFolder = 'try';
            if (!fs.existsSync(this.targetFolder)) {
                fs.mkdirSync(this.targetFolder);
            }

            this.generateModDesc();

            let sourcePath = this.project.get('code');
            if (sourcePath) {
                sourcePath = this.project.filePath(sourcePath);

                this.generateCode(sourcePath, release);
            }

            if (release) {
console.log("Verify and clean translations");
            }

            const iconPath = this.project.filePath('icon.dds');
            if (!fs.existsSync(iconPath)) {
                console.error('Icon DDS is missing. Create an icon to continue the build.');
                return;
            } else {
                this.copyResource('icon.dds');
            }

            this.project.get('resources', []).forEach((p: string) => this.copyResource(p));

            this.createZipFile(update);
        } finally {
            // this.cleanUp();
        }
    }

    private generateModDesc(): void {
        const modDescPath = this.project.filePath('modDesc.xml');
        let modDesc = this.parseXML(modDescPath);

        _.set(modDesc, 'modDesc.$.descVersion', BuildCommand.LATEST_MODDESC_VER);
        _.set(modDesc, 'modDesc.version', this.project.get('version', '0.0.0.0'));
        _.set(modDesc, 'modDesc.author', this.project.get('author', _.get(modDesc, 'modDesc.author')));

        if (this.targetFolder) {
            this.writeXML(path.join(this.targetFolder, 'modDesc.xml'), modDesc);
        }
    }

    private generateCode(sourcePath: string, release: boolean): void {
        console.log("Template all files in", sourcePath);

        //            - Read source files, fill values, write source files

            /*

            Note: If Release build:
            - Disable local build config, only use from farmsim.yaml, and use its release data if available
             */
    }

    private copyResource(sourcePath: string): void {
        if (this.targetFolder) {
            fs.copySync(this.project.filePath(sourcePath), path.join(this.targetFolder, sourcePath));
        }
    }

    private createZipFile(update: boolean): void {
        let zipName = this.project.get('zip_name', this.project.get('name'));

        if (update) {
            zipName += '_update';
        }

        zipName += '.zip';


        console.log("Make zipfile named", zipName);
    }

    /**
     * Clean up the build, especially in case of failure.
     */
    private cleanUp(): void {
        if (this.targetFolder) {
            fs.removeSync(this.targetFolder);

            this.targetFolder = null;
        }
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
        let builder = new xml2js.Builder({
            cdata: true,
            renderOpts: {
                pretty: true,
                indent: '    '
            }
        });

        let xml = builder.buildObject(data);

        fs.writeFileSync(path, xml, { encoding: 'utf8' });

        return true;
    }
}
