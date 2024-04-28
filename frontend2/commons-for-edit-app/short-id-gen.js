const base62Chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

let prevLargest = 0;

/**
 * Generates approximately 11-character strings consisting of a base62-encoded unix
 * timestamp (with milliseconds) and a 4-character random portion. Example:
 *
 * ```javascript
 * const now = Date.now(); // 1708429511346
 * const shortId = generateShortId(now); // 'u4Pi7F8a6jd'
 *
 * // 'u4Pi7F8a6jd'
 * //     ^   ^
 * //     |   |
 * //     |   |______ Random portion, always 4 characters
 * //     |
 * //     |__________ Base62-encoded timestamp,
 * //                 typically 7 characters
 * ```
 *
 * @param {Number} t = null
 * @returns {String}
 */
function generateShortId(t = null) {
    const nowMilli = t || Date.now();
    if (!prevLargest) {
        prevLargest = nowMilli;
        return genId(nowMilli);
    } else {
        if (nowMilli > prevLargest)
            prevLargest = nowMilli;
        else
            prevLargest += 1;
        return genId(prevLargest);
    }
}

/**
 * @param {String} shortId
 * @returns {{timestampWithMillis: Number; randomPart: String;}}
 */
function shortIdToComponents(shortId) {
    const timePart = shortId.substring(0, shortId.length - 4);
    const randomPart = shortId.substring(shortId.length - 4);
    const nowMilli = base62Decode(timePart);
    return {
        timestampWithMillis: nowMilli,
        randomPart: randomPart,
    };
}

/**
 * @param {Number} nowMilli
 * @returns {String}
 */
function genId(nowMilli) {
    const timePart = base62Encode(nowMilli);

    let randomPart = '';
    for (let i = 0; i < 4; ++i)
        randomPart += base62Chars[getRandomIntInclusive(61)];

    return `${timePart}${randomPart}`;
}

/**
 * Original code https://github.com/base62/base62.js/blob/9d980bb167408c0bfc61dfab28ae17bc95d0ba90/lib/ascii.js,
 * MIT-license.
 *
 * @param {Number} num
 * @returns {String}
 */
function base62Encode(num) {
    const encoded = [];
    do {
        encoded.unshift(base62Chars[num % 62]);
        num = Math.floor(num / 62);
    } while (num > 0);
    return encoded.join('');
}

/**
 * @param {String} shortId
 * @returns {Number}
 */
function base62Decode(shortId) {
    const chars = base62Chars.split('');
    return shortId.split('').reduce((out, c) =>
        out * 62 + chars.indexOf(c)
    , 0);
}

/**
 * https://stackoverflow.com/a/42321673
 * @param {Number} max
 * @returns {Number}
 */
function getRandomIntInclusive(max) {
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const randomNumber = randomBuffer[0] / (0xffffffff + 1);
    return Math.floor(randomNumber * (Math.floor(max) + 1));
}

function reset() {
    prevLargest = 0;
}

export {generateShortId, shortIdToComponents, reset};
