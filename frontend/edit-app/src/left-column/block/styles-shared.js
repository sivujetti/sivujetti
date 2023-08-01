import {createUnitClass} from './VisualStyles.jsx';

const SPECIAL_BASE_UNIT_NAME = '_body_';
const specialBaseUnitCls = createUnitClass('', SPECIAL_BASE_UNIT_NAME);

/**
 * @param {Array<{id: String; [key: String]: any;}} currentUnits
 * @returns {Number}
 */
function getLargestPostfixNum(currentUnits) {
    return currentUnits.reduce((out, {id}) => {
        const maybe = parseInt(id.split('-').pop());
        return !isNaN(maybe) ? maybe > out ? maybe : out : out;
    }, 0);
}

/**
 * @param {Array<ThemeStyle>} from
 * @param {String} blockTypeName
 * @returns {ThemeStyle|undefined}
 */
function findBlockTypeStyles(from, blockTypeName) {
    return from.find(s => s.blockTypeName === blockTypeName);
}

export {SPECIAL_BASE_UNIT_NAME, specialBaseUnitCls, getLargestPostfixNum, findBlockTypeStyles};
