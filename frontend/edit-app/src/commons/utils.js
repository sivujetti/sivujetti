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

  return function() {
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

export {stringUtils, timingUtils, objectUtils, generatePushID};
