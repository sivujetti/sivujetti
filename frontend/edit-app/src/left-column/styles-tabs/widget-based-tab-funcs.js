import {SPECIAL_BASE_UNIT_NAME, ir1, getRemoteBodyUnit, blockHasStyleClass,
        createUnitClass, isBodyRemote} from './styles-tabs-common.js';

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

export {getEnabledUnits, getEditableUnits, createAddableUnits, createDataPropForValueInputRenderer};
