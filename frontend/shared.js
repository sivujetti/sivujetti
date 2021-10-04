/**
 * https://stackoverflow.com/a/2911045
 *
 * @param {HTMLElement} outerEl
 */
function markInternalLinksAsInternal(outerEl) {
    const host = location.hostname;
    Array.from(outerEl.querySelectorAll('a')).forEach(a => {
        if (a.hostname === host || !a.hostname.length)
            a.href += `${a.search[0] !== '?' ? '?' : '&'}in-edit`;
    });
}

export {markInternalLinksAsInternal};
