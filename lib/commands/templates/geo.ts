import Template from './template';

import * as _ from 'lodash';

export default class GeoTemplate extends Template {
    constructor() {
        super('GEO', 'geo');
    }

    farmsim(data: any) {
        data['resources'] = [ 'data' ];
        data['type'] = 'geo';
    }

    moddesc(data: any) {
        _.set(data, 'modDesc.seasons.$.version', 2);
        _.set(data, 'modDesc.seasons.type', 'geo');
        _.set(data, 'modDesc.seasons.dataFolder', 'data/');
    }

    requiredFolders(): string[] {
        return [ 'data' ];
    }
}
