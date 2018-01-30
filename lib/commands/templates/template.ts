export default class Template {
    constructor(public title: string, public name: string) {
    }

    farmsim(data: any) {}
    moddesc(data: any) {}
    requiredFolders(): string[] {
        return [];
    }

    async init() {}
}
