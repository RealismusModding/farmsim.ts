import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export default class System {
    private static gameFolder: string = "FarmingSimulator2017";

    /**
     * Get user directory full path
     *
     * @return {string} [description]
     */
    public static getUserDirectory(): string {
        return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] || "~/";
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
            relative = "Library/Application Support/" + System.gameFolder;
        } else {
            relative = "Documents/My Games/" + System.gameFolder
        }

        return path.normalize(path.resolve(user, relative));
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
}
