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
        let file = Project.findProjectRoot(program.file);
        if (!file) {
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

    private static findProjectRoot(suggested?: string): string | null {
        if (suggested) {
             const p = path.resolve(suggested);

             if (!fs.existsSync(p)) {
                 throw 'Project at given path does not exist';
             }

             return p;
        }

        // Look in current dir, and then up
        let root = process.cwd();
        do {
            let p = path.join(root, 'farmsim.yml')
            if (fs.existsSync(p)) {
                return p;
            }

            let newRoot = path.dirname(root);
            if (newRoot === root) {
                break;
            }
            root = newRoot;
        } while (root !== '/')

        return null;
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

    public getFolder(): string {
        return path.dirname(this.path);
    }

    public zipName(update?: boolean, isConsole?: boolean): string {
        update = update || false;
        isConsole = isConsole || false;

        let zipName = this.get('zip_name', this.get('name'));

        if (isConsole) {
            zipName += '_console';
        }

        if (update) {
            zipName += '_update';
        }

        zipName += '.zip';

        return zipName;
    }
}
