import {__} from '@sivujetti-commons-for-edit-app';
import store2 from '../../store2.js';
import {valueEditors} from './VisualStyles.jsx';

class BlockStylesTab3 extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        //
    }
    /**
     * @param {StylesTab3Props} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.isVisible && !this.state.initd) {
            const allStyleMetas = store2.get().styleUnitMetas;
            const {blockTypeName} = this.props;
            const currentBlockStylesMeta = blockTypeName ? getStylesMetaFor(blockTypeName, allStyleMetas) : null;
            this.setState({currentBlockStylesMeta, currentBlockUnits: [], initd: true});
        } else if (!props.isVisible && this.state.initd) {
            this.unload();
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unload();
    }
    /**
     * @access protected
     */
    render(_, {currentBlockStylesMeta, currentBlockUnits, initd}) {
        if (!initd) return;
        return currentBlockStylesMeta.length ? currentBlockStylesMeta.map(sm =>
            <div class="group">{ sm.vars.map(mv => {
                const Renderer = valueEditors.get(mv.type);
                const [v, unitVarVals] = getVarValueFor(mv, currentBlockUnits, sm);
                const valHasUnit = unitVarVals !== null; // var is described in StyleUnitMeta, but has no StyleUnitVarVals yet
                const args = []; // ??
                const valIsSet = v !== null;
                return <Renderer
                    metaCopy={ {...mv} }
                    valueCopy={ v ? {...v.value} : null }
                    argsCopy={ [...args] }
                    varName={ mv.varName }
                    valueWrapStr={ '' }
                    valHasUnit={ valHasUnit }
                    valIsSet={ valIsSet }
                    isClearable={ valIsSet }
                    labelTranslated={ __(mv.label) }
                    onVarValueChanged={ newValAsString => {
                        if (newValAsString !== null) {
                            if (!valIsSet)
                                addValueAndEmit(newValAsString, valHasUnit);
                            else
                                updateValueAndEmit(newValAsString);
                        } else {
                            removeValueAndEmit();
                        }
                    } }/>;
            }) }</div>
        ) : <div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>;
    }
    /**
     * @access private
     */
    unload() {
        this.setState({currentBlockStylesMeta: null, currentBlockUnits: null, initd: false});
    }
}

/**
 * @param {String} newValAsString
 * @param {Boolean} alreadyHasUnit
 */
function addValueAndEmit(newValAsString, alreadyHasUnit) {
    if (alreadyHasUnit) {
        throw new Error('todo');
    } else {
        throw new Error('todo');
    }
}

/**
 * @param {String} newValAsString
 * @param { } ? 
 * @param { } ? 
 */
function updateValueAndEmit(newValAsString, styleUnitMetaId, varName) {
    throw new Error('todo');
}

/**
 * @param { } ? 
 * @param { } ? 
 */
function removeValueAndEmit(styleUnitMetaId, varName) {
    throw new Error('todo');
}

/**
 * @param {String} blockTypeName
 * @param {Array<StyleUnitMeta>} allStylesMeta
 * @returns {Array<StyleUnitMeta>}
 */
function getStylesMetaFor(blockTypeName, allStylesMeta) {
    const styleUnitMetasForThisBlock = allStylesMeta.filter(sm => {
        const asArr = sm.suggestedFor.split(' ');
        return asArr.indexOf('all') > -1 || asArr.indexOf(blockTypeName) > -1;
    });
    return styleUnitMetasForThisBlock;
}

/**
 * @param {UnitVarMeta} v
 * @param {Array<StyleUnitVarValues>} unitsVarVals
 * @param {StyleUnitMeta} sm
 * @returns {Array<UnitVarValue|null, StyleUnitVarValues|null>}
 */
function getVarValueFor(v, unitsVarVals, sm) {
    const varVals = unitsVarVals.find(uv => uv.unitMetaId === sm.id);
    if (!varVals)
        return [null, null];
    //
    const val = varVals.values.find(v2 => v2.varName === v.varName);
    return [val, varVals];
}

/**
 * @typedef StylesTab3Props
 * @prop {Boolean} isVisible
 * @prop todo todo
 */

export default BlockStylesTab3;
