import Command from '../command';
import Utils from '../utils';
import Project from '../project';
import BuildConfig from '../buildconfig';
import System from '../system';

import * as fs from 'fs';
import * as path from 'path';
import * as logger from 'winston';
import * as _ from 'lodash';
import * as libxmljs from 'libxmljs';
import * as child_process from 'child_process';
import * as hasbin from 'hasbin';

class VerifyFileError {
    constructor(public file: string, public line: number, public column: number, public message: string) {
        this.message = _.trim(this.message);
    }

    description(): string {
        return `${this.file}:${this.line}:${this.column}: ${this.message}`;
    }
}

export default class VerifyCommand extends Command {
    public project: Project;
    public config: BuildConfig;

    public install(): void {
        this.program
            .command('verify')
            .description('Verify contents of the mod source.')
            .action(Utils.commandRunnerWithErrors(this.run, this));
    }

    public async run(options: any) {
        this.project = await Project.load(this.program);
        this.config = BuildConfig.load();

        logger.info("Verifying mod '" + this.project.get("name") + "'");

        return this.verify();
    }

    private async verify() {
        let totalChecks = 0;
        let totalFailures = 0;
        let totalErrors = 0;

        let xmlFiles = this.findXmlBasedFiles();

        logger.info("Running XML validation on " + xmlFiles.length + " files...");

        xmlFiles.forEach(file => {
            totalChecks++;

            const errors = this.verifyXml(file)

            errors.forEach(err => logger.error(err.description()));
            totalErrors += errors.length;

            if (errors.length > 0) {
                totalFailures++;
            }
        })

        const codeRoot = this.project.get('code');
        if (codeRoot) {
            const luaFiles = this.findPaths(this.project.filePath(codeRoot), '.lua');

            if (!this.hasLuaJit()) {
                logger.warn('No LuaJIT installation found. LuaJIT is required for LUA validation.');
            } else {
                logger.info("Running LUA validation on " + luaFiles.length + " files...");

                luaFiles.forEach(file => {
                    totalChecks++;

                    const errors = this.verifyLua(file)

                    errors.forEach(err => logger.error(err.description()));
                    totalErrors += errors.length;

                    if (errors.length > 0) {
                        totalFailures++;
                    }
                });
            }
        }

        logger.info("Ran " + totalChecks + " verifications. " + totalFailures + " failed, with " + totalErrors + " errors.");

        if (totalFailures > 0) {
            process.exitCode = 1;
        }
    }

    private findPaths(root: string, extension: string): string[] {
        if (!fs.statSync(root).isDirectory()) {
            if (path.extname(root) === extension) {
                return [ root ];
            } else {
                return [];
            }
        }

        const items = fs.readdirSync(root);
        return _.flatMap(items, (item) => this.findPaths(path.join(root, item), extension));
    }

    private findXmlBasedFiles(): string[] {
        let xmlFiles: string[] = [
            this.project.filePath('modDesc.xml')
        ];

        this.project.get('resources', []).forEach((res: string) => {
            const p = this.project.filePath(res);

            xmlFiles = xmlFiles.concat(this.findPaths(p, '.xml'));
            xmlFiles = xmlFiles.concat(this.findPaths(p, '.i3d'));
        });

        if (this.project.get('translations')) {
            xmlFiles = xmlFiles.concat(this.findPaths(this.project.filePath('translations'), '.xml'))
        }

        return xmlFiles;
    }

    private verifyXml(file: string): VerifyFileError[] {
        const relPath = path.relative(this.project.getFolder(), file);

        const xml = fs.readFileSync(file, { encoding: 'utf8' });

        try {
            const xmlDoc = libxmljs.parseXml(xml);
            const errors = _.isFunction(xmlDoc.errors) ? xmlDoc.errors() : (xmlDoc.errors);

            return (<SyntaxError[]>errors).map(ex => new VerifyFileError(relPath, 0, 0, ex.message));
        } catch (ex) {
            return [ new VerifyFileError(relPath, ex.line, ex.column, ex.message) ];
        }
    }

    private hasLuaJit(): boolean {
        return hasbin.sync('luajit');
    }

    private verifyLua(file: string): VerifyFileError[] {
        const relPath = path.relative(this.project.getFolder(), file);

        const handleErrorLine = (line: string): VerifyFileError | null => {
            if (!line.startsWith('luajit: ')) {
                return null;
            }

            const spl = line.split(':');
            // 0 = luajit:, 1 = file, 2 = line, 3 = ~message

            const lineNo = parseInt(spl[2].trim());
            const message = spl[3].trim();

            return new VerifyFileError(relPath, lineNo, 0, message);
        };

        const handleOutput = (out: string, err: string): VerifyFileError[] =>
            _(err.split('\n'))
            .map(_.trim)
            .filter(line => line.length > 0)
            .map(handleErrorLine)
            .flatMap(error => error ? [error] : [])
            .value();

        try {
            const result = child_process.spawnSync('luajit', ['-bgl', file], {
                encoding: 'utf-8',
                timeout: 15000
            });

            return handleOutput(result.stdout as any, result.stderr as any);
        } catch (e) {
            return handleOutput(e.stdout, e.stderr);
        }
    }
}
