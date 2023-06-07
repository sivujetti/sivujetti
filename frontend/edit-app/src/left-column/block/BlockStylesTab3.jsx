import {__, api} from '@sivujetti-commons-for-edit-app';
import store, { pushItemToOpQueue } from '../../store.js';
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
                                addValueAndEmit(Renderer.valueFromInput(newValAsString), mv.varName, valHasUnit, sm, this.props);
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
 * @param {ColorValue|LengthValue|OptionValue} newVal
 * @param {String} varName
 * @param {Boolean} alreadyHasUnit
 * @param {StyleUnitMeta} meta
 * @param {StylesTab3Props} props
 */
function addValueAndEmit(newVal, varName, alreadyHasUnit, meta, props) {
    if (alreadyHasUnit) {
        throw new Error('todo');
    } else {
        // #1 add related StyleUnitMeta's css to the page if not present?
        // store2.dispatch('styleUnitMetas/addItem', [{}]);

        // #2 Add class to the block
        props.emitAddStyleClassToBlock(meta.id, props.getBlockCopy());

        // #3 Add new styleUnitVarVals with one variable value in it
        const values = [{varName, value: {...newVal}}];
        const id = '??';
        store2.dispatch('styleUnitVarVals/addItem', [{
            id,
            styleUnitMetaId: meta.id,
            values,
            generatedCss: `.${meta.id} { ${varValsToString(values, meta)} }`
        }]);
        store.dispatch(pushItemToOpQueue('update-style-unit-var-vals', {
            doHandle: () => { return 'http.put(todo /api/style-unit-var-vals)'; },
            doUndo: () => {
                // Undo this (#3)
                store2.dispatch('styleUnitVarVals/removeItem', [id]);
                // Undo #2
                setTimeout(() => { api.saveButton.triggerUndo(); }, 100);
            },
            args: [],
        }));
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
 * @param {Array<UnitVarValue>} varValues
 * @param {StyleUnitMeta} meta
 * @returns {String}
*/
function varValsToString(varValues, meta) {
    return varValues.map(v => {
        const valMeta = meta.vars.find(vm => vm.varName === v.varName);
        const Cls = valueEditors.get(valMeta.type);
        return `--${v.varName}: ${Cls.valueToString(v.value)}`;
    }).join('; ');
}

/**
 * @typedef StylesTab3Props
 * @prop {Boolean} isVisible
 * @prop todo todo
 */

export default BlockStylesTab3;
