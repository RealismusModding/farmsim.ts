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
    private targetFolder: string;
    public project: Project;
    public config: BuildConfig;

    public install(): void {
        this.program
            .command('build')
            .description('Build the mod')
            .option('-r, --release', 'Create a release build')
            .option('-u, --update', 'Create an update build')
            .option('-c, --console', 'Create a console build')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any) {
        this.project = await Project.load(this.program);

        logger.info("Building mod '" + this.project.get("name") + "'");

        this.config = BuildConfig.load();

        return this.build(options.release || options.update, options.update, options.console)
    }

    public async build(release: boolean, update: boolean, isConsole: boolean) {
        // Catch all issues to not end up with gigabytes of failed builds
        try {
            this.targetFolder = fs.mkdtempSync(path.join(this.project.getFolder(), '.fsbuild-'));

            await this.generateModDesc(isConsole);

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

            // If console, remove any designated resources
            if (isConsole) {
                await this.removeUnwantedConsoleResources();
            }

            const zipName = this.project.zipName(update);
            await this.createZipFile(zipName);
        } finally {
            await this.cleanUp();
        }
    }

    private async generateModDesc(isConsole: boolean) {
        const src = this.project.filePath('modDesc.xml');
        const dst = path.join(this.targetFolder, 'modDesc.xml');

        const modDesc = this.parseXML(src);

        // Copy the file
        await Utils.copy(src, dst);

        // Modify destination
        xmlpoke(dst, xml => {
            xml.setOrAdd('modDesc/@descVersion', Utils.getLatestDescVer());
            xml.setOrAdd('modDesc/version', this.project.get('version', '0.0.0.0'));

            xml.setOrAdd('modDesc/author', this.project.get('author', _.get(modDesc, 'modDesc.author.0')));

            const contributors = this.project.get('contributors', []);
            if (contributors.length > 0) {
                xml.setOrAdd('modDesc/contributors', contributors.join(", "));
            }

            if (isConsole) {
                this.project.get('console.del_moddesc', [])
                    .forEach((del: string) => xml.remove(del));
            }
        });
    }

    private async generateCode(sourcePath: string, release: boolean) {
        // Create the template values
        const templates = Utils.getTemplates(this.project, this.config, release);

        const readdir = util.promisify(fs.readdir);
        const copy = util.promisify(fs.copyFile);
        const stat = util.promisify(fs.stat);
        const mkdir = util.promisify(fs.mkdir);

        const folder = async (src: string, dst: string): Promise<any> => {
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
    private async copyResource(sourcePath: string) {
        return Utils.copy(this.project.filePath(sourcePath), path.join(this.targetFolder, sourcePath));
    }

    /**
     * Create zip-file using the build destination folder
     * @param  {boolean}       update Is an update
     * @return {Promise<void>}
     */
    private async createZipFile(zipName: string) {
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
                .pipe(fs.createWriteStream(this.project.filePath(zipName)))
                .on('close', resolve)
                .on('error', reject);

            zip.end();
        });
    }

    /**
     * Find all items in a directory that match given filter.
     * @param  {string}     src Root
     * @param  {string) =>  boolean}     filter Filter
     * @return {string[]}            List
     */
    private dirContents(src: string, filter: (val: string) => boolean): any[] {
        if (!fs.existsSync(src)) {
            return [];
        }

        const files = fs.readdirSync(src);
        return _.flatMap(files, file => {
            const filename = path.join(src, file);
            const stat = fs.lstatSync(filename);

            if (stat.isDirectory()) {
                const items = this.dirContents(filename, filter);

                if (filter(filename)) {
                    items.push({ name: filename, isDir: true });
                }

                return items;
            } else if (filter(filename)) {
                return { name: filename, isDir: false };
            }

            return [];
        });
    };

    /**
     * Remove skip_files for console builds.
     */
    private async removeUnwantedConsoleResources() {
        const files = this.project.get('console.skip_files', []);

        // Find all items in the target that match
        const items = this.dirContents(this.targetFolder, val => {
            const subPath = path.relative(this.targetFolder, val);
            return _.some(files, e => _.startsWith(subPath, e));
        });

        // Delete them
       items.forEach(item => {
           if (item.isDir) {
               fs.rmdirSync(item.name);
           } else {
               fs.unlinkSync(item.name);
           }
       });
    }

    /**
     * Clean up the build, especially in case of failure.
     */
    private async cleanUp() {
        if (fs.existsSync(this.targetFolder)) {
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
    private async writeXML(path: string, data: any) {
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
