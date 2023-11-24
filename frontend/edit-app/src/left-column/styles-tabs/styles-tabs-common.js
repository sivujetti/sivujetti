const SPECIAL_BASE_UNIT_NAME = '_body_';
const specialBaseUnitCls = createUnitClass('', SPECIAL_BASE_UNIT_NAME);

/**
 * @param {Array<ThemeStyle>} from
 * @param {String} blockTypeName
 * @returns {ThemeStyle|undefined}
 */
function findBlockTypeStyles(from, blockTypeName) {
    return from.find(s => s.blockTypeName === blockTypeName);
}

/**
 * @param {String} id
 * @param {String} blockTypeName
 * @returns {String}
 */
function createUnitClass(id, blockTypeName) {
    return `j-${blockTypeName}` + (id ? `-${id}` : '');
}

/**
 * @param {String} unitCls Example 'j-Button-unit-1'
 * @param {String} blockTypeName
 * @param {String} specifier = ''
 * @returns {String} Example '.j-_body_ .j-Button:not(.no-j-Button-unit-1)'
 */
function createUnitClassSpecial(unitCls, blockTypeName, specifier = '') {
    const selBtype = createUnitClass('', blockTypeName); // Example 'j-Button'
    return `${specialBaseUnitCls}${validateAndGetSpecifier(specifier)} .${selBtype}:not(.no-${unitCls})`;
}

/**
 * @param {String} candidate
 * @returns {String} ` ${candidate}` or ''
 */
function validateAndGetSpecifier(candidate) {
    if (!candidate) return '';
    // todo validate
    return ` ${candidate}`;
}

/**
 * @param {String} cls
 * @param {RawBlock|BlockStub} block
 * @param {Boolean} isRemote = false
 * @returns {Boolean}
 */
function blockHasStyleClass(cls, {styleClasses}, isRemote = false) {
    return !isRemote
        ? styleClasses.split(' ').indexOf(cls) > -1
        : styleClasses.split(' ').indexOf(`no-${cls}`) > -1;
}

/**
 * @param {RawBlock|BlockStub} blockCopy
 * @param {ThemeStyleUnit|null} unit
 * @param {String} cls = null
 * @returns {Boolean}
 */
function blockHasStyle(blockCopy, unit, cls = null) {
    if (!cls && unit) cls = createUnitClass(unit.id, blockCopy.type);
    if (!unit.origin) {
        return blockHasStyleClass(cls, blockCopy, false);
    } else {
        if (unit.origin !== SPECIAL_BASE_UNIT_NAME) throw new Error('Not supported.');
        return blockHasStyleClass(cls, blockCopy, true);
    }
}

/**
 * @param {RawBlock|BlockStub} block
 * @param {ThemeStyleUnit} unit
 * @returns {Boolean}
 */
function ir1(block, unit) {
    if (!unit.isDerivable) {
        return blockHasStyle(block, unit);
    } else {
        return false;
    }
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {String} blockTypeName
 * @param {Array<ThemeStyleUnit>} bodyStyleUnits
 * @param {Boolean} copy = false
 * @returns {ThemeStyleUnit|null}
 */
function getRemoteBodyUnit(unit, blockTypeName, bodyStyleUnits, copy = true) {
    const lookFor = createUnitClass(unit.id, blockTypeName);
    const out = bodyStyleUnits.find(u => u.id === lookFor);
    return out ? copy ? {...out} : out : null;
}

/**
 * 'unit-1' -> not body remote
 * 'j-Section-unit-1' -> is body remote
 *
 * @param {String|null} id Example 'j-Section-unit-4' or 'unit-2'
 * @returns {Boolean}
 */
function isBodyRemote(id) {
    return id && id.split('-').length > 3;
}

/**
 * @param {Array<ThemeStyle>} styles
 * @returns {ThemeStyleUnit}
*/
function findBodyStyle(styles) {
    return styles.find(s => s.blockTypeName === SPECIAL_BASE_UNIT_NAME);
}

export {findBlockTypeStyles, ir1, SPECIAL_BASE_UNIT_NAME, getRemoteBodyUnit,
        blockHasStyleClass, createUnitClass, createUnitClassSpecial, isBodyRemote,
        findBodyStyle};
