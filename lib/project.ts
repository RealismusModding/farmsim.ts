import * as commander from 'commander';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

export default class Project {
    private data: any;

    constructor(public path: string) {
        this.data = {};
    }

    public load(): void {
        this.data = yaml.safeLoad(fs.readFileSync(this.path, 'utf-8'));
    }

    public getData(): any {
        return this.data;
    }

    public static async load(program: commander.CommanderStatic): Promise<Project> {
        // Find current project file
        let file = program.file;
        if (!file) {
            file = "./farmsim.yml";
        }

        if (!fs.existsSync(file)) {
            throw "Could not find project file '" + file + "'";
        }

        const project = new Project(file);

        try {
            project.load();
        } catch (e) {
            throw "Failed to load project file '" + file + "': " +  e.message;
        }

        return project;
    }

    public get(path: string, defaultValue?: any): any | null {
        return _.get(this.data, path, defaultValue);
    }

    public has(path: string): boolean {
        return _.has(this.data, path);
    }

    /**
     * Get a filepath for a project file (file relative to project root).
     *
     * @param  {string} p Relative path
     * @return {string}   Path
     */
    public filePath(p: string): string {
        return path.join(path.dirname(this.path), p);
    }

    public zipName(update?: boolean): string {
        update = update || false;

        let zipName = this.get('zip_name', this.get('name'));

        if (update) {
            zipName += '_update';
        }

        zipName += '.zip';

        return zipName;
    }
}
