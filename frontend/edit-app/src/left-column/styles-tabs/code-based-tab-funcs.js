/**
 * @param {Array<any>} unitsOfThisBlockType
 * @param {Number} openIdx
 * @returns {Array<String>}
 */
function createLiClasses(itemsToShow, openIdx) {
    return itemsToShow.map((_, i) => i !== openIdx ? '' : ' open');
}

export {createLiClasses};