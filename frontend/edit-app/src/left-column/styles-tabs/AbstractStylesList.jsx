import {__} from '@sivujetti-commons-for-edit-app';
import {createUnitClass, createUnitClassSpecial, findBlockTypeStyles, findRealUnit,
        isBodyRemote} from './styles-tabs-common.js';
import {removeStyleClassMaybeRemote, removeStyleUnitMaybeRemote} from './widget-based-tab-funcs.js';

const {compile, serialize, stringify} = window.stylis;

class AbstractStylesList extends preact.Component {
    // editableTitleInstances;
    // moreMenu;
    /**
     * @access protected
     */
    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error('Abstract method not implemented.');
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.editableTitleInstances = [];
        this.moreMenu = preact.createRef();
    }
    /**
     * @access protected
     */
    receiveUnits(units) {
        this.editableTitleInstances = units.map(_ => preact.createRef());
    }
    /**
     * @param {Array<MenuLink>} moreLinks
     * @returns {Array<MenuLink>}
     * @access protected
     */
    createContextMenuLinks(moreLinks) {
        return [
            {text: __('Edit name'), title: __('Edit name'), id: 'edit-style-title'},
            ...moreLinks,
        ];
    }
    /**
     * @param {ContextMenuLink} link
     * @returns {Boolean}
     * @access protected
     */
    handleMoreMenuLinkClicked({id}) {
        if (id === 'edit-style-title') {
            this.editableTitleInstances[this.liIdxOfOpenMoreMenu].current.open();
            return true;
        }
        if (id === 'deactivate-style') {
            const [unit] = this.getOpenUnit();
            removeStyleClassMaybeRemote(unit, this.props.blockCopy);
            return true;
        }
        if (id === 'delete-style') {
            const [unit, arr, isCodeBased] = this.getOpenUnit();
            if (isCodeBased) {
                const maybeRemote = findRealUnit(unit, this.props.blockCopy.type);
                if (maybeRemote.isDerivable && arr.some(unit => unit.derivedFrom === maybeRemote.id)) {
                    alert(__('This template has derivates and cannot be deleted.'));
                    return true;
                }
            }
            removeStyleUnitMaybeRemote(unit, this.props.blockCopy);
            return true;
        }
        return false;
    }
    /**
     * @returns {[ThemeStyleUnit, Array<ThemeStyleUnit>, Boolean]}
     * @access protected
     */
    getOpenUnit() {
        const isCodeBased = Array.isArray(this.state.liClasses);
        const arr = this.state.itemsToShow;
        return [arr[this.liIdxOfOpenMoreMenu], arr, isCodeBased];
    }
}

/**
 * @param {ThemeStyleUnit} unit
 * @param {String} blockTypeName
 * @returns {{isDefault: Boolean; cls: String;}}
 */
function createListItem(unit, blockTypeName) {
    const isDefault = isBodyRemote(unit.id);
    return {
        isDefault,
        cls: !isDefault ? createUnitClass(unit.id, blockTypeName) : createUnitClassSpecial(unit.id, blockTypeName)
    };
}

/**
 * @param {Array<ThemeStyle>} themeStyles
 * @param {String} blockTypeName
 * @returns {Array<ThemeStyleUnit>}
 */
function getUnitsOfBlockType(themeStyles, blockTypeName) {
    return findBlockTypeStyles(themeStyles, blockTypeName)?.units || [];
}

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
 * @param {String} scss
 * @param {String} cls
 * @returns {String}
 */
function compileScss(scss, cls) {
    return serialize(compile(`.${cls} {${scss}}`), stringify);
}

export default AbstractStylesList;
export {createListItem, getUnitsOfBlockType, getLargestPostfixNum, compileScss};
