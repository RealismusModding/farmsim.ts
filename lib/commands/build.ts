import Command from '../command';
import Project from '../project';
import BuildConfig from '../buildconfig';
import System from '../system';
import Utils from '../utils';

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

import * as logger from 'winston';
import * as xml2js from 'xml2js';
import * as _ from 'lodash';
import * as yazl from 'yazl';
import * as replaceStream from 'replacestream';
import * as xmlpoke from 'xmlpoke';

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
        const project = await Project.load(this.program);

        logger.info("Building mod '" + project.get("name") + "'");

        this.project = project;
        this.config = BuildConfig.load();

        return this.build(options.release || options.update, options.update)
    }

    public async build(release: boolean, update: boolean): Promise<void> {
        // Catch all issues to not end up with gigabytes of failed builds
        try {
            this.targetFolder = fs.mkdtempSync('.fsbuild-');

            await this.generateModDesc();

            const sourcePath = this.project.get('code');
            if (sourcePath) {
                await this.generateCode(this.project.filePath(sourcePath), release);
            }

            if (release) {
logger.debug("Verify and clean translations");
            }

            // A mod requires an icon, copy it or fail.
            const iconPath = this.project.filePath('icon.dds');
            if (fs.existsSync(iconPath)) {
                await this.copyResource('icon.dds');
            } else {
                throw 'Icon DDS is missing. Create an icon to continue the build.';
            }

            // If there are translations, copy them
            if (this.project.get('translations')) {
                await this.copyResource('translations/');
            }

            // Copy any resources referenced in the project
            await Promise.all(this.project.get('resources', []).map((p: string) => this.copyResource(p)));

            const zipName = this.project.zipName(update);
            await this.createZipFile(zipName);
        } finally {
            await this.cleanUp();
        }
    }

    private async generateModDesc(): Promise<void> {
        const src = this.project.filePath('modDesc.xml');
        const dst = path.join(this.targetFolder, 'modDesc.xml');

        const modDesc = this.parseXML(src);

        // Copy the file
        await Utils.copy(src, dst);

        // Modify destination
        xmlpoke(dst, xml => {
            xml.setOrAdd('modDesc/@descVersion', BuildCommand.LATEST_MODDESC_VER);
            xml.setOrAdd('modDesc/version', this.project.get('version', '0.0.0.0'));

            xml.setOrAdd('modDesc/author', this.project.get('author', _.get(modDesc, 'modDesc.author.0')));

            const contributors = this.project.get('contributors', []);
            if (contributors.length > 0) {
                xml.setOrAdd('modDesc/contributors', contributors.join(", "));
            }
        });
    }

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

        const readdir = util.promisify(fs.readdir);
        const copy = util.promisify(fs.copyFile);
        const stat = util.promisify(fs.stat);
        const mkdir = util.promisify(fs.mkdir);

        const folder = async (src: string, dst: string): Promise<void> => {
            const items = await readdir(src);

            return Promise.all(items.map(async (item) => {
                const itemSrc = path.join(src, item);
                const itemDst = path.join(dst, item);

                const stats = await stat(itemSrc);
                if (stats.isFile()) {
                    // Read from source
                    let stream = fs.createReadStream(itemSrc);

                    // For each template, add a transformer pipe
                    _.forEach(templates, (value, key) => {
                        const regex = "([a-zA-Z0-9]+) \-\-<%=" + key + " %>";
                        const re = new RegExp(regex, "g");

                        stream = stream.pipe(replaceStream(re, value.toString()));
                    });

                    // Write to destination
                    return new Promise((resolve, reject) => {
                        stream
                            .pipe(fs.createWriteStream(itemDst))
                            .on('finish', resolve)
                            .on('error', reject);
                    });
                } else if (stats.isDirectory()) {
                    await mkdir(itemDst);

                    // Recursively handle the folder
                    return folder(itemSrc, itemDst);
                }
            })).then(() => {});
        };

        const target = path.join(this.targetFolder, sourcePath);
        return util.promisify(fs.mkdir)(target)
            .then(() => folder(sourcePath, target));
    }

    /**
     * Copy a resource or folder 1-to-1, recursively, to the build folder
     *
     * @param  {string}        sourcePath path
     * @return {Promise<void>}
     */
    private async copyResource(sourcePath: string): Promise<void> {
        return Utils.copy(this.project.filePath(sourcePath), path.join(this.targetFolder, sourcePath));
    }

    /**
     * Create zip-file using the build destination folder
     * @param  {boolean}       update Is an update
     * @return {Promise<void>}
     */
    private async createZipFile(zipName: string): Promise<void> {
        if (!this.targetFolder) {
            return;
        }

        let zip = new yazl.ZipFile();

        // Recursively copying folders
        const folder = (src: string, dst: string) => fs.readdirSync(src).forEach(item => {
            const itemSrc = path.join(src, item);
            const itemDst = path.join(dst, item);

            const stats = fs.statSync(itemSrc);

            if (stats.isFile()) {
                zip.addFile(itemSrc, itemDst);
            } else if (stats.isDirectory()) {
                zip.addEmptyDirectory(itemDst);

                folder(itemSrc, itemDst);
            }
        });

        folder(this.targetFolder, '.');

        // This has to be async
        return new Promise<void>((resolve, reject) => {
            zip.outputStream
                .pipe(fs.createWriteStream(zipName))
                .on('close', resolve)
                .on('error', reject);

            zip.end();
        });
    }

    /**
     * Clean up the build, especially in case of failure.
     */
    private async cleanUp(): Promise<void> {
        if (fs.existsSync(this.targetFolder)) {
            logger.debug("Removing build folder");
            return Utils.removeFolder(this.targetFolder);
        }
    }

    /**
     * Parse an XML file into a JavaScript object.
     *
     * @param  {string} path Path of the file
     * @return {any}         Javascript object or null
     */
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

    /**
     * Write XML from a JavaScript object.
     *
     * Note: do not use when the output needs forced CDATA.
     *
     * @param  {string}  path Path of the file
     * @param  {any}     data Object
     * @return {boolean}      true on success, false on failure
     */
    private async writeXML(path: string, data: any): Promise<void> {
        let builder = new xml2js.Builder({
            cdata: true,
            renderOpts: {
                pretty: true,
                indent: '    '
            }
        });

        let xml = builder.buildObject(data);

        const writeFile = util.promisify(fs.writeFile);
        return writeFile(path, xml, { encoding: 'utf8' });
    }
}
