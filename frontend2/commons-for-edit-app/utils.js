const stringUtils = {
    /**
     * https://gist.github.com/mathewbyrne/1280286#gistcomment-2353812
     * https://stackoverflow.com/a/37511463
     *
     * @param {String} text
     * @returns {String}
     */
    slugify(text) {
        return text.toString().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove special characters
            .replace(/\s+/g, '-')    // Replace spaces with -
            .replace(/[^\w-]+/g, '') // Remove all non-word chars
            .replace(/--+/g, '-')    // Replace multiple - with single -
            .replace(/^-+/, '')      // Trim - from start of text
            .replace(/-+$/, '');     // Trim - from end of text
    },
    /**
     * @param {String} str
     * @returns {String}
     */
    capitalize(str) {
        return `${str.charAt(0).toUpperCase()}${str.substring(1, str.length)}`;
    }
};

const timingUtils = {
    /**
     * https://davidwalsh.name/javascript-debounce-function
     *
     * @param {Function} func
     * @param {Number} wait
     * @param {Boolean=} immediate
     */
    debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
};

const objectUtils = {
    /**
     * @param {Array<String>} keys
     * @param {Object} obj
     * @returns {Object}
     */
    clonePartially(keys, obj) {
        return this.cloneDeep(keys.reduce((out, key) => {
            out[key] = obj[key];
            return out;
        }, {}));
    },
    /**
     * @param {Object} obj
     * @returns {Object}
     */
    cloneDeep(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
};

export {
    objectUtils,
    stringUtils,
    timingUtils,
};
