import * as commander from 'commander';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

import System from './system';

export default class BuildConfig {
    private data: any;

    constructor(data?: any) {
        this.data = data || {};
    }

    public getData(): any {
        return this.data;
    }

    public static load(): BuildConfig {
        const fileName = ".fsbuild.yml";
        let dirs = [];

        // Look in current dir and every directory up until the user dir
        const userPath = System.getUserDirectory();
        let current = process.cwd();
        do {
            dirs.push(current);
            current = path.dirname(current);
        } while (current !== userPath);

        // Also look in user path
        dirs.push(userPath);

        // First load most up, then override with files lower in the tree
        dirs.reverse();

        let data = {};
        dirs
            .map((dir) => path.resolve(dir, fileName))
            .filter((filePath) => fs.existsSync(filePath))
            .forEach((filePath) => {
            try {
                let fileData = yaml.safeLoad(fs.readFileSync(filePath, 'utf-8'));

                data = _.defaultsDeep(fileData, data);
            } catch (e) {
                console.error("Failed to load config file '" + filePath + "':", e.message);
            }
        });

        return new BuildConfig(data);
    }
}
