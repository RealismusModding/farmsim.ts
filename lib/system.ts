import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as _ from 'lodash';
import {exec, spawn} from 'child_process';

import BuildConfig from './buildconfig';

export default class System {
    private static gameFolder: string = "FarmingSimulator2017";
    private static gameName: string = "Farming Simulator 2017";

    /**
     * Get user directory full path
     *
     * @return {string} [description]
     */
    public static getUserDirectory(): string {
        return process.env[System.isWindows() ? 'USERPROFILE' : 'HOME'] || "~/";
    }

    /**
     * Get the user directory for the farming simulator game.
     *
     * @return {string} [description]
     */
    public static getGameUserDirectory(): string {
        const user = System.getUserDirectory();
        let relative = '';

        if (System.isMacOS()) {
            relative = "Library/Containers/com.astragon.farmingsim17/Data/Library/Application Support/" + System.gameFolder
            if (!fs.existsSync(path.resolve(user, relative))) {
                relative = "Library/Application Support/" + System.gameFolder;
            }
        } else {
            relative = "Documents/My Games/" + System.gameFolder
        }

        return path.normalize(path.resolve(user, relative)); //.replace(/ /g, '\\ ');
    }

    /**
     * Whether the computer is running macOS.
     *
     * @return {boolean} true when running macOS, false otherwise.
     */
    public static isMacOS(): boolean {
        return os.type() == 'Darwin';
    }

    /**
     * Whether the computer is running Windows.
     *
     * @return {boolean} true when running Windows, false otherwise.
     */
    public static isWindows(): boolean {
        return os.type() == 'Windows_NT';
    }

    /**
     * Get the default, topmost installation path.
     *
     * @return {string} path or null if no installation found
     */
    public static async getDefaultInstallationPath(): Promise<string> {
        const path = _.first(await System.getInstallationPaths());

        if (path) {
            return Promise.resolve(path);
        }

        return Promise.reject("No Farming Simulator installation found.");
    }

    /**
     * Get all found and configured installation paths.
     *
     * Searches for normal installations, Mac App Store and Steam installations.
     * Also adds existing configured installations.
     *
     * @return {string[]} List of FS installation paths
     */
    public static async getInstallationPaths(): Promise<string[]> {
        return this.getSystemPaths().then((paths: string[]) => {
            // Add intallations
            const config = BuildConfig.load();

            paths = paths.concat(_.values(config.get('installations')));

            return paths.filter((filePath) => fs.existsSync(filePath));
        });
    }

    /**
     * Get paths based on system type
     *
     * @return {string[]} paths
     */
    private static async getSystemPaths(): Promise<string[]> {
        let paths: string[] = [];

        if (System.isMacOS()) {
            // normal / app store
            paths.push(`/Applications/${System.gameName}.app`);
            // Steam
            paths.push(path.resolve(System.getUserDirectory(), `~/Library/Application Support/Steam/steamapps/common/${System.gameName}/${System.gameName}.app`));
        } else {
            await System.getWindowsAvailableDisks().then(disks => {
                // Note: windows users tend to move there "games" to other disks ..
                for (let disk of disks) {
                    // normal
                    paths.push(`${disk}//Program Files (x86)/${System.gameName}/${System.gameFolder}.exe`);
                    paths.push(`${disk}//Program Files/${System.gameName}/${System.gameFolder}.exe`);
                    // steam
                    paths.push(`${disk}/Program Files (x86)/Steam/steamapps/common/${System.gameName}/${System.gameFolder}.exe`);
                    paths.push(`${disk}/Program Files/Steam/steamapps/common/${System.gameName}/${System.gameFolder}.exe`);
                }
            })
        }

        return Promise.resolve(paths);
    }

    /**
     * Get available disks on Windows
     *
     * @return {string[]} disks
     */
    private static async getWindowsAvailableDisks(): Promise<string[]> {
        const cmd = spawn("cmd");

        return new Promise<string[]>((resolve, reject) => {
            cmd.stdout.on("data", function (chunk: any) {
                // cast it to string
                const output = String(chunk);
                const data = output.split("\r\n").map(_.trim).filter(e => e != "" && e.length <= 2);

                if (data.length != 0) {
                    resolve(data);
                }
            });

            cmd.on("exit", function (code: number) {
                if (code !== 0) {
                    reject(code);
                }
            });

            cmd.stdin.write("wmic logicaldisk get name\n");
            cmd.stdin.end();
        })
    }

    public static getInstallationType(path: string): string {
        path = path.toLowerCase();

        // If has 'steam'
        if (path.indexOf('steamapps') !== -1) {
            return 'steam';
        }

        // If Mac App Store app
        // TODO
        // if (false) {
        //     return 'appstore';
        // }

        // If has .app
        if (path.endsWith('.app')) {
            return 'app';
        }

        return 'exe';
    }

    public static openFileInEditor(path: string) {
        exec(System.getCommandLine() + ' "' + path + '"');
    }

    public static getCommandLine(): string {
        switch (process.platform) {
            case 'darwin':
                return 'open';
            case 'win32':
                return 'start ""';
            default:
                return 'xdg-open';
        }
    }

    public static getUser(): string | null {
        if (System.isWindows()) {
            return process.env['USERNAME'] || null;
        }

        return process.env['USER'] || null;
    }
}
