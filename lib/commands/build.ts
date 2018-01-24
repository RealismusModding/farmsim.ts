import Command from '../command';
import Project from '../project';
import BuildConfig from '../buildconfig';
import System from '../system';
import Utils from '../utils';

import * as logger from 'winston';

import * as fs from 'fs-extra';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as _ from 'lodash';
import * as yazl from 'yazl';
import * as replaceStream from 'replacestream';

export default class BuildCommand extends Command {
    private static LATEST_MODDESC_VER: number = 38;

    private targetFolder: string;
    public project: Project;
    public config: BuildConfig;

    public install(): void {
        this.program
            .command('build')
            .description('Build the mod')
            .option('-r, --release', 'Create a release build')
            .option('-u, --update', 'Create an update build')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any): Promise<void> {
        const project = Project.load(this.program);
        if (!project) {
            logger.error("Not a farmsim project.");
            return;
        }

        logger.debug("Building mod '" + project.get("name") + "'");

        this.project = project;
        this.config = BuildConfig.load();

        return this.build(options.release || options.update, options.update).then(() => {});
    }

    public async build(release: boolean, update: boolean): Promise<void> {
        // Catch all issues to not end up with gigabytes of failed builds
        try {
            this.targetFolder = fs.mkdtempSync('.fsbuild-');

            this.generateModDesc();

            let sourcePath = this.project.get('scripts');
            if (sourcePath) {
                sourcePath = this.project.filePath(sourcePath);

                // this.generateCode(sourcePath, release);
            }

            if (release) {
logger.debug("Verify and clean translations");
            }

            const iconPath = this.project.filePath('icon.dds');
            if (fs.existsSync(iconPath)) {
                this.copyResource('icon.dds');
            } else {
                return Promise.reject('Icon DDS is missing. Create an icon to continue the build.');
            }

            if (this.project.get('translations')) {
                this.copyResource('translations/');
            }

            this.project.get('resources', []).forEach((p: string) => this.copyResource(p));

            this.createZipFile(update);
        } catch (e) {
            this.cleanUp();

            return Promise.reject(e);
        }
    }

    private generateModDesc(): void {
        const modDescPath = this.project.filePath('modDesc.xml');
        let modDesc = this.parseXML(modDescPath);

        _.set(modDesc, 'modDesc.$.descVersion', BuildCommand.LATEST_MODDESC_VER);
        _.set(modDesc, 'modDesc.version', this.project.get('version', '0.0.0.0'));
        _.set(modDesc, 'modDesc.author', this.project.get('author', _.get(modDesc, 'modDesc.author')));

        this.writeXML(path.join(this.targetFolder, 'modDesc.xml'), modDesc);
    }

/*
    private async generateCode(sourcePath: string, release: boolean): Promise<void> {
        // Create the template values
        let templates = this.project.get('templates', {});

        if (release) {
            // Override with release templates
            templates = _.defaults(this.project.get('release.templates', {}), templates);
        } else {
            // Override with build config
            templates = _.defaults(this.config.get('templates', {}), templates);
        }

        const folder = (src: string, dst: string) => {
            fs.readdirSync(src).forEach((item) => {
                const itemSrc = path.join(src, item);
                const itemDst = path.join(dst, item);

                console.log("+ ", itemSrc, '=>', itemDst);

                const stats = fs.statSync(itemSrc);
                if (stats.isFile()) {
                    console.log("file");

                    // fs.copySync(itemSrc, itemDst);

                    // ISSUE: THIS IS ASYNC, REST IS SYNC
                    let stream = fs.createReadStream(itemSrc);

                    // TODO: do not hardcode a template
                    _.forEach(templates, (value, key) => {
                        stream = stream.pipe(replaceStream(/([a-zA-Z0-9]+) \-\-<%=debug %>/g, '1'))
                    });

                    stream
                        .pipe(fs.createWriteStream(itemDst))
                        .on('finish', resolve);

                } else if (stats.isDirectory()) {
                    fs.mkdirSync(itemDst);

                    folder(itemSrc, itemDst);
                }
            });
        }

        const target = path.join(this.targetFolder, sourcePath);
        fs.mkdirSync(target)

        folder(sourcePath, target);
    }
    */

    private copyResource(sourcePath: string): void {
        fs.copySync(this.project.filePath(sourcePath), path.join(this.targetFolder, sourcePath));
    }

    private createZipFile(update: boolean): void {
        if (!this.targetFolder) {
            return;
        }

        let zipName = this.project.get('zip_name', this.project.get('name'));

        if (update) {
            zipName += '_update';
        }

        zipName += '.zip';

        var zipfile = new yazl.ZipFile();

        // Recursively copying folders
        const folder = (src: string, dst: string) => {
            fs.readdirSync(src).forEach((item) => {
                const itemSrc = path.join(src, item);
                const itemDst = path.join(dst, item);

                // console.log("- ", itemSrc, '=>', itemDst);

                const stats = fs.statSync(itemSrc);
                if (stats.isFile()) {
                    zipfile.addFile(itemSrc, itemDst);

                } else if (stats.isDirectory()) {
                    zipfile.addEmptyDirectory(itemDst);

                    folder(itemSrc, itemDst);
                }
            });
        }

        folder(this.targetFolder, '.');

        // This has to be async
        zipfile.outputStream
            .pipe(fs.createWriteStream(zipName))
            .on("close", () => this.cleanUp());

        zipfile.end();
    }

    /**
     * Clean up the build, especially in case of failure.
     */
    private cleanUp(): void {
        if (fs.existsSync(this.targetFolder)) {
            logger.debug("Removing build folder");
            fs.removeSync(this.targetFolder);
        }
    }

    private parseXML(path: string): any | null {
        const contents = fs.readFileSync(path, 'utf8');
        let data = null;

        xml2js.parseString(contents, (err, result) => {
            if (err) {
                logger.error(err);
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
