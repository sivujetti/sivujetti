import {cloneDeep} from '../shared-inline.js';
import {generateShortId} from './short-id-gen.js';

const stringUtils = {
    /**
     * https://gist.github.com/mathewbyrne/1280286#gistcomment-2353812
     * https://stackoverflow.com/a/37511463
     *
     * @param {string} text
     * @returns {string}
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
     * @param {string} str
     * @returns {string}
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
     * @param {number} wait
     * @param {boolean=} immediate
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
     * @param {Array<string>} keys
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
    cloneDeep,
    /**
     * @param {Object} obj
     * @param {(newCopyFreeToMutate: Object) => any} mutator
     * @returns {Object} Mutated $obj
     */
    cloneDeepWithChanges(obj, doTheChanges) {
        const clone = this.cloneDeep(obj);
        doTheChanges(clone);
        return clone;
    }
};

/**
 * @param {'default'|'undo'|'redo'|undefined|null} changeSource
 */
function isUndoOrRedo(changeSource) {
    return changeSource === 'undo' || changeSource === 'redo';
}

/**
 * https://gist.github.com/mikelehen/3596a30bd69384624c11
 */
const generatePushID = (function() {
  // Modeled after base64 web-safe chars, but ordered by ASCII.
  var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

  // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
  var lastPushTime = 0;

  // We generate 72-bits of randomness which get turned into 12 characters and appended to the
  // timestamp to prevent collisions with other clients.  We store the last characters we
  // generated because in the event of a collision, we'll use those same characters except
  // "incremented" by one.
  var lastRandChars = [];

  return function(genShortInstead = false) {
    if (genShortInstead && window.sivujettiUserFlags?.useShortIds)
        return generateShortId();
    var now = new Date().getTime();
    var duplicateTime = (now === lastPushTime);
    lastPushTime = now;

    var timeStampChars = new Array(8);
    for (var i = 7; i >= 0; i--) {
      timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
      // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
      now = Math.floor(now / 64);
    }
    if (now !== 0) throw new Error('We should have converted the entire timestamp.');

    var id = timeStampChars.join('');

    if (!duplicateTime) {
      for (i = 0; i < 12; i++) {
        lastRandChars[i] = Math.floor(Math.random() * 64);
      }
    } else {
      // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
      for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
        lastRandChars[i] = 0;
      }
      lastRandChars[i]++;
    }
    for (i = 0; i < 12; i++) {
      id += PUSH_CHARS.charAt(lastRandChars[i]);
    }
    if(id.length != 20) throw new Error('Length should be 20.');

    return id;
  };
})();

export {
    generatePushID,
    generateShortId,
    isUndoOrRedo,
    objectUtils,
    stringUtils,
    timingUtils,
};
