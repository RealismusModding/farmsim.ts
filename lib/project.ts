import * as commander from 'commander';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

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
}
