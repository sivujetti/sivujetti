/**
 * @param {Object} obj
 * @returns {Object}
 */
function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

const objectUtils = {
    /**
     * @param {Array<String>} keys
     * @param {Object} obj
     * @returns {Object}
     */
    clonePartially(keys, obj) {
        return keys.reduce((out, key) => {
            const val = obj[key];
            if (Array.isArray(val))
                out[key] = val;
            else if (typeof val === 'object')
                out[key] = JSON.parse(JSON.stringify(val));
            else
                out[key] = val;
            return out;
        }, {});
    }
};

export {cloneDeep, objectUtils};
