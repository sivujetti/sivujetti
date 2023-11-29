import {api} from '@sivujetti-commons-for-edit-app';
import store2 from '../../store2.js';
import {SPECIAL_BASE_UNIT_NAME, ir1, getRemoteBodyUnit, blockHasStyleClass,
        createUnitClass, isBodyRemote, dispatchNewBlockStyleClasses, findRealUnit,
        blockHasStyle, splitUnitAndNonUnitClasses, emitCommitStylesOp, findBlockTypeStyles,
        findBaseUnitOf} from './styles-tabs-common.js';
import {valueEditors} from './scss-ast-funcs.js';

const {compile, serialize, stringify} = window.stylis;

/**
 * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
 * @param {Array<ThemeStyleUnit>} bodyStyleUnits
 * @param {BlockStub|RawBlock} block
 * @returns {Array<ThemeStyleUnit>}
 */
function getEnabledUnits(unitsOfThisBlockType, bodyStyleUnits, block) {
    const out = [];
    for (const unit of unitsOfThisBlockType) {
        if (unit.origin !== SPECIAL_BASE_UNIT_NAME) {
            if (ir1(block, unit))
                out.push(unit);
        } else {
            const remote = getRemoteBodyUnit(unit, block.type, bodyStyleUnits, false);
            if (remote && !blockHasStyleClass(`no-${createUnitClass(unit.id, block.type)}`, block, true)) out.push(remote);
        }
    }
    return out;
}

/**
 * @param {Array<ThemeStyleUnit>} enabledUnits May contain remotes and units with no vars
 * @param {Boolean} userIsTechnical
 * @returns {Array<ThemeStyleUnit>}
 */
function getEditableUnits(enabledUnits, userIsTechnical) {
    if (userIsTechnical) {
        // Return remote units only if there's no inherited ones
        return enabledUnits.length === 1 ? enabledUnits : enabledUnits.filter(unit => !isBodyRemote(unit.id));
    } else {
        return enabledUnits.filter(unit => !isBodyRemote(unit.id));
    }
}

/**
 * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
 * @param {Array<ThemeStyleUnit>} enabledUnits
 * @param {String} blockTypeName
 * @param {Boolean} userIsTechnical
 * @returns {[Array<ThemeStyleUnit>, Array<ThemeStyleUnit>]} [instantiables, normalsOrReferences]
 */
function createAddableUnits(unitsOfThisBlockType, enabledUnits, blockTypeName, userIsTechnical) {
    userIsTechnical = false;
    const reference = [];
    const instantiable = [];
    if (!userIsTechnical) {
        for (const unit of unitsOfThisBlockType) {
            if (unit.origin !== SPECIAL_BASE_UNIT_NAME) {
                if (!unit.isDerivable) {
                    if (!enabledUnits.find(unit2 => unit2.id === unit.id)) reference.push(unit);
                } else {
                    if (!enabledUnits.find(unit2 => unit2.id === unit.id)) instantiable.push(unit);
                }
            } else {
                const remote = getRemoteBodyUnit(unit, blockTypeName, enabledUnits, false);
                if (remote) {
                    if (remote.isDerivable) instantiable.push(remote);
                }
            }
        }
    }
    return [instantiable, reference];
}

/**
 * @param {CssVar} cssVar
 * @param {ThemeStyleUnit} unit
 * @param {String} cls
 * @param {[String, String]|null} sdu = null
 * @returns {{selector: String; mediaQueryWrap: String|null; supportingCss?: String;}|null}
 */
function createDataPropForValueInputRenderer(cssVar, unit, cls, sdu = null) {
    if (cssVar.type !== 'color') return null;

    return {
        ...{selector: `.${cls}`, mediaQueryWrap: sdu},
        ...(unit.optimizedGeneratedCss && unit.optimizedScss.indexOf(`var(--${cssVar.varName}`) < 0
            ? {supportingCss: `@layer units { ${unit.generatedCss} }`}
            : {})
    };
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {RawBlock} block
 */
function removeStyleClassMaybeRemote(unit, block) {
    if (unit.derivedFrom) {
        const a = !isBodyRemote(unit.derivedFrom)
            ? `${createUnitClass(unit.derivedFrom, block.type)} ` // Example 'j-Section-unit-3 '
            : '';
        const b = createUnitClass(unit.id, block.type); // Example 'j-Section-d-4' or 'j-JetFormsTextInput-d-2'
        return emitReplaceClassesFromBlock(block, `${a}${b}`, '');
    }
    const maybeRemote = findRealUnit(unit, block.type);
    const to = false;
    const from = true;
    return toggleStyleIsActivated(createUnitClass(unit.id, block.type),
                                    to, from, maybeRemote !== unit, block);
}

/**
 * @param {RawBlock|BlockStub} block Example 'j-Button-d-7 foo'
 * @param {String} clsFrom Example 'j-Button-d-7'
 * @param {String} clsTo Example 'j-Button-d-23'
 * @returns {String} Example 'j-Button-d-23 foo'
 */
function emitReplaceClassesFromBlock(block, clsFrom, clsTo) {
    const currentClasses = block.styleClasses;
    const newClasses = currentClasses.replace(clsFrom, clsTo).trim();
    dispatchNewBlockStyleClasses(newClasses, block);
    return newClasses;
}

/**
 * @param {String} cls
 * @param {Boolean} newIsActivated
 * @param {Boolean} currentIsActivated
 * @param {Boolean} isRemote
 * @param {RawBlock} blockCopy
 * @returns {String}
 */
function toggleStyleIsActivated(cls, newIsActivated, currentIsActivated, isRemote, blockCopy) {
    if (!isRemote) {
        if (newIsActivated && !currentIsActivated)
            return emitAddStyleClassToBlock(cls, blockCopy);
        if (!newIsActivated && currentIsActivated)
            return emitRemoveStyleClassFromBlock(cls, blockCopy);
    } else { // invert
        // Example: 'no-j-Section-unit-1'
        const no = `no-${cls}`;
        const hasNo = blockHasStyle(blockCopy, null, no);
        if (!newIsActivated && !hasNo)
            return emitAddStyleClassToBlock(no, blockCopy);
        if (newIsActivated && hasNo)
            return emitRemoveStyleClassFromBlock(no, blockCopy);
    }
}

/**
 * @param {String} styleClassToAdd
 * @param {RawBlock} block
 * @returns {String}
 */
function emitAddStyleClassToBlock(styleClassToAdd, block) {
    const currentClasses = block.styleClasses;
    const [a1, b] = splitUnitAndNonUnitClasses(currentClasses);
    const a = a1 ? `${a1} ${styleClassToAdd}` : styleClassToAdd;
    const newClasses = `${a}${a && b ? ' ' : ''}${b}`.trim();
    dispatchNewBlockStyleClasses(newClasses, block);
    return newClasses;
}

/**
 * @param {String} styleClassToRemove
 * @param {RawBlock} block
 * @returns {String}
 */
function emitRemoveStyleClassFromBlock(styleClassToRemove, block) {
    const currentClasses = block.styleClasses;
    const newClasses = currentClasses.split(' ').filter(cls => cls !== styleClassToRemove).join(' ').trim();
    dispatchNewBlockStyleClasses(newClasses, block);
    return newClasses;
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {RawBlock} block
 */
function removeStyleUnitMaybeRemote(unit, block) {
    const maybeRemote = findRealUnit(unit, block.type);
    if (maybeRemote === unit)
        removeStyleUnit(unit, null, block);
    else
        removeStyleUnit(unit, maybeRemote, null);
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {ThemeStyleUnit|null} remote
 * @param {RawBlock|null} block
 */
function removeStyleUnit(unit, remote, block) {
    if (!remote) {
        // #2
        emitRemoveStyleClassFromBlock(createUnitClass(unit.id, block.type), block);

        // #1
        store2.dispatch('themeStyles/removeUnitFrom', [block.type, remote || unit]);

        const clone = {...unit};
        emitCommitStylesOp(block.type, () => {
            // #1
            store2.dispatch('themeStyles/addUnitTo', [block.type, clone]);
            // #2
            setTimeout(() => { api.saveButton.triggerUndo(); }, 100);

        }, null, null);
    } else {
        // #1 and #2 (both units (remote and its "shell") is removed from themeStyles store here)
        store2.dispatch('themeStyles/removeUnitFrom', [SPECIAL_BASE_UNIT_NAME, remote]);

        const clone = {...remote};
        emitCommitStylesOp(SPECIAL_BASE_UNIT_NAME, () => {
            // #1
            store2.dispatch('themeStyles/addUnitTo', [SPECIAL_BASE_UNIT_NAME, clone]);
            // #2
            store2.dispatch('themeStyles/addUnitTo', [clone.origin, unit]);
        }, unit, remote.origin);
    }
}

/**
 * @param {String} varName Example: 'textNormal_TextCommon_u1'
 * @returns {String} Example: 'textNormal'
 */
function withoutAppendix(varName) {
    return varName.split('_')[0];
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
 * @returns {ThemeStyleUnit|null}
 */
function getBaseUnit(unit, unitsOfThisBlockType) {
    const isDerivedFromBodyUnit = isBodyRemote(unit.derivedFrom);
    const baseStyleUnits = !isDerivedFromBodyUnit ? unitsOfThisBlockType : findBlockTypeStyles(store2.get().themeStyles, SPECIAL_BASE_UNIT_NAME).units;
    return findBaseUnitOf(unit, baseStyleUnits);
}

/**
 * @param {Array<CssVar>} cssVars
 * @param {Array<CssVar>} baseVars
 * @returns {Array<UnitVarInsights>}
 */
function createVarInsights(cssVars, baseVars) {
    return cssVars.map(cssVar => {
        const bpv = baseVars.find(({varName}) => varName === cssVar.varName);
        return {
            baseValueLiteral: bpv.valueLiteral,
            hasBaseValue: cssVar.valueLiteral === bpv.valueLiteral
        };
    });
}

/**
 * @param {String} scss
 * @param {String} cls
 * @returns {String}
 */
function compileScss(scss, cls) {
    return serialize(compile(`.${cls} {${scss}}`), stringify);
}

export {getEnabledUnits, getEditableUnits, createAddableUnits, createDataPropForValueInputRenderer,
        removeStyleClassMaybeRemote, removeStyleUnitMaybeRemote, withoutAppendix,
        getBaseUnit, createVarInsights, compileScss};
