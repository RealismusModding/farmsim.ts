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

    public static load(program: commander.CommanderStatic): Project | null {
        // Find current project file
        let file = program.file;
        if (!file) {
            file = "./farmsim.yml";
        }

        if (!fs.existsSync(file)) {
            console.error("Could not find project file '" + file + "'");
            return null;
        }

        const project = new Project(file);

        try {
            project.load();
        } catch (e) {
            console.error("Failed to load project file '" + file + "':", e.message);
            return null;
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
}
