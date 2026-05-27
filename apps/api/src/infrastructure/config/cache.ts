import NodeCache from 'node-cache';
export const appCache = new NodeCache({ stdTTL: 600, checkperiod: 120, maxKeys: 1000, useClones: false });
