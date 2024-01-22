/**
 * @param {String} slug
 * @returns {Boolean}
 */
function isAnotherAppView(slug) {
    return [
        '/uploads',
        '/website/edit-basic-info',
        '/website/edit-global-scripts',
        '/website/updates',
        '/pages',
    ].indexOf(slug) > -1;
}

export {isAnotherAppView as isEditAppViewUrl};