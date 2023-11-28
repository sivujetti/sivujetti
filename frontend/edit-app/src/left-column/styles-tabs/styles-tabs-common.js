import {api, env, http} from '@sivujetti-commons-for-edit-app';
import {getIsStoredToTreeIdFrom} from '../../block/utils-utils.js';
import store, {pushItemToOpQueue} from '../../store.js';
import store2 from '../../store2.js';

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

/**
 * @param {String} newStyleClasses
 * @param {RawBlock|BlockStub} blockCopy
 * @access private
 */
function dispatchNewBlockStyleClasses(newStyleClasses, blockCopy) {
    const changes = {styleClasses: newStyleClasses};
    const isOnlyStyleClassesChange = true;
    const {id, styleClasses} = blockCopy;
    const prevData = styleClasses;
    const isStoredToTreeId = getIsStoredToTreeIdFrom(id, 'mainTree');
    store2.dispatch('theBlockTree/updateDefPropsOf', [id, isStoredToTreeId, changes, isOnlyStyleClassesChange, prevData]);
}

/**
 * @param {ThemeStyleUnit} unit1
 * @param {String} blockTypeName
 * @param {Array<ThemeStyle>} themeStyles = null
 * @returns {ThemeStyleUnit}
 */
function findRealUnit(unit1, blockTypeName, themeStyles = null) {
    if (!unit1.origin) return unit1;
    if (unit1.origin !== SPECIAL_BASE_UNIT_NAME) throw new Error('Not implemented.');
    //
    if (!themeStyles) ({themeStyles} = store2.get());
    const bodyStyle = findBodyStyle(themeStyles);
    const lookFor = createUnitClass(unit1.id, blockTypeName);
    return bodyStyle.units.find(({id}) => id === lookFor) || unit1;
}

/**
 * @param {String} styleClasses
 * @returns {[String, String]} [unitClasses, nonUnitClasses]
 */
function splitUnitAndNonUnitClasses(styleClasses) {
    const all = styleClasses.split(' ');
    return all
        .reduce((arrs, cls, i) => {
            arrs[isUnitClass(cls) ? 0 : 1].push(all[i]);
            return arrs;
        }, [[], []])
        .map(clsList => clsList.join(' '));
}

/**
 * @param {String} cls Example 'j-Section-unit-15' or 'j-Section-d-16'
 * @returns {Boolean}
 */
function isUnitClass(cls) {
    const pcs = cls.split('-');
    return pcs.length === 4 && pcs[0] === 'j';
}

/**
 * @param {String} blockTypeName
 * @param {() => void} doUndo
 * @param {ThemeStyleUnit} removedRemote = null
 * @param {String} removedRemoteBlockTypeName = null
 */
function emitCommitStylesOp(blockTypeName, doUndo, removedRemote = null, removedRemoteBlockTypeName = null) {
    const url = `/api/themes/${api.getActiveTheme().id}/styles/scope-block-type/${blockTypeName}`;
    store.dispatch(pushItemToOpQueue(`upsert-theme-style#${url}`, {
        doHandle: () => {
            const style = findBlockTypeStyles(store2.get().themeStyles, blockTypeName);
            const remoteStyle = removedRemote ? getRemoteStyleIfRemoved(style.units, removedRemote.id, removedRemoteBlockTypeName) : null;
            const data = {
                ...{units: style.units},
                ...(!remoteStyle ? {} : {connectedUnits: remoteStyle.units, connectedUnitsBlockTypeName: removedRemoteBlockTypeName})
            };
            return http.put(url, data)
                .then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => {
                    env.window.console.error(err);
                    return true;
                });
        },
        doUndo,
        args: [],
    }));
}

/**
 * @param {Array<ThemeStyleUnit>} bodyUnits
 * @param {String} removedUnitId
 * @param {String} removedUnitBlockTypeName
 */
function getRemoteStyleIfRemoved(bodyUnits, removedUnitId, removedUnitBlockTypeName) {
    const lookFor = createUnitClass(removedUnitId, removedUnitBlockTypeName);
    // Normal case: $lookFor is _not_ found from $bodyUnits
    if (!bodyUnits.some(({id}) => id === lookFor))
        return findBlockTypeStyles(store2.get().themeStyles, removedUnitBlockTypeName);
    return null;
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {Array<ThemeStyleUnit>} from
 * @returns {ThemeStyleUnit|null}
 */
function findBaseUnitOf(unit, from) {
    const lookFor = unit.derivedFrom;
    return from.find(u => u.id === lookFor) || null;
}

/**
 * @param {ThemeStyleUnit} unitCopy
 * @param {(unitCopy: ThemeStyleUnit) => ({newScss: String; newGenerated: String; newOptimizedScss?: String|null; newOptimizedGenerated?: String|null; specifier?: String;}|null)} getUpdates
 * @param {String} blockTypeName
 */
function updateAndEmitUnitScss(unitCopy, getUpdates, blockTypeName) {
    const {id, scss, generatedCss, optimizedScss, optimizedGeneratedCss} = unitCopy;
    const dataBefore = {...{scss, generatedCss}, ...(!optimizedGeneratedCss ? {} : {optimizedScss, optimizedGeneratedCss})};
    //
    const updates = getUpdates(unitCopy);
    if (!updates) return;
    //
    emitUnitChanges({...{
        scss: updates.newScss,
        generatedCss: updates.newGenerated,
    }, ...(!updates.newOptimizedGenerated ? {} : {
        optimizedScss: updates.newOptimizedScss,
        optimizedGeneratedCss: updates.newOptimizedGenerated,
    })}, dataBefore, blockTypeName, id);
}

/**
 * @param {{scss?: String; generatedCss?: String; specifier?: String; isDerivable?: String;}} updates
 * @param {ThemeStyleUnit} before
 * @param {String} blockTypeName
 * @param {String} unitId Example 'unit-12' (if origin = '' | '_body_'), 'j-Something-uniot-12' (if origin = 'Something')
 * @param {() => void} doUndo = null
 */
function emitUnitChanges(updates, before, blockTypeName, unitId, doUndoFn = null) {
    store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, updates]);
    emitCommitStylesOp(blockTypeName, doUndoFn || (() => {
        store2.dispatch('themeStyles/updateUnitOf', [blockTypeName, unitId, before]);
    }));
}

export {findBlockTypeStyles, ir1, SPECIAL_BASE_UNIT_NAME, getRemoteBodyUnit,
        blockHasStyleClass, createUnitClass, createUnitClassSpecial, isBodyRemote,
        findBodyStyle, dispatchNewBlockStyleClasses, findRealUnit, blockHasStyle,
        splitUnitAndNonUnitClasses, emitCommitStylesOp, specialBaseUnitCls,
        findBaseUnitOf, updateAndEmitUnitScss};
