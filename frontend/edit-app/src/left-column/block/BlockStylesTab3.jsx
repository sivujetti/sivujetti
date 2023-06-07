import {__, api} from '@sivujetti-commons-for-edit-app';
import {varValsToString} from '../../block-styles/styleUnitVarValsStore.js';
import store, {pushItemToOpQueue} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {valueEditors} from './VisualStyles.jsx';

class BlockStylesTab3 extends preact.Component {
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [observeStore2('styleUnitVarVals', ({styleUnitVarVals}, [event]) => {
            if (event === 'styleUnitVarVals/init') return;
            this.updateUnitVarValues(styleUnitVarVals);
        })];
    }
    /**
     * @param {StylesTab3Props} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.isVisible && !this.state.initd) {
            const {styleUnitMetas, styleUnitVarVals} = store2.get();
            const {blockTypeName} = this.props;
            const block = blockTypeName ? props.getBlockCopy() : null;
            const currentBlockStylesMeta = block ? getStylesMetaFor(blockTypeName, styleUnitMetas) : null;
            const currentBlockVarValUnits = block ? getUnitsVarValsFor(onlyVarValUnitClasses(block.styleClasses.split(' ')), styleUnitVarVals) : null;
            this.setState({currentBlockStylesMeta, currentBlockVarValUnits, initd: true});
        } else if (!props.isVisible && this.state.initd) {
            this.unload();
        }
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unload();
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render(_, {currentBlockStylesMeta, currentBlockVarValUnits, initd}) {
        if (!initd) return;
        return currentBlockStylesMeta.length ? currentBlockStylesMeta.map(sm =>
            <div class="group" key={ sm.id }>{ sm.vars.map(mv => {
                const Renderer = valueEditors.get(mv.type);
                const [v, unitVarVals] = getVarValueFor(mv, currentBlockVarValUnits, sm);
                const valHasUnit = unitVarVals !== null; // var is described in StyleUnitMeta, but has no StyleUnitVarVals yet
                const args = []; // ??
                const valIsSet = v !== null;
                return <Renderer
                    metaCopy={ {...mv} }
                    valueAsString={ v ? v.value : null }
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
                                addValueAndEmit(newValAsString, mv.varName, valHasUnit, sm, this.props);
                            else
                                updateValueAndEmit(newValAsString, mv.varName, unitVarVals.id, v);
                        } else {
                            removeValueAndEmit();
                        }
                    } }
                    key={ mv.id }/>;
            }) }</div>
        ) : <div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>;
    }
    /**
     * @access private
     */
    unload() {
        this.setState({currentBlockStylesMeta: null, currentBlockVarValUnits: null, initd: false});
    }
    /**
     * @access private
     */
    updateUnitVarValues(styleUnitVarVals) {
        const block = this.props.getBlockCopy();
        const currentBlockVarValUnits = block ? getUnitsVarValsFor(onlyVarValUnitClasses(block.styleClasses.split(' ')), styleUnitVarVals) : null;
        this.setState({currentBlockVarValUnits});
    }
}

/**
 * @param {String} newVal
 * @param {String} varName
 * @param {Boolean} alreadyHasUnit
 * @param {StyleUnitMeta} meta
 * @param {StylesTab3Props} props
 */
function addValueAndEmit(newVal, varName, alreadyHasUnit, meta, props) {
    if (alreadyHasUnit) {
        throw new Error('todo');
    } else {
        const id = 'j-svv-1'; // todo
        // #1 add related StyleUnitMeta's css to the page if not present?
        // store2.dispatch('styleUnitMetas/addItem', [{}]);

        // #2 Add class to the block
        props.emitAppendStrToBlockStyleClasses(`${meta.id} ${id}`, props.getBlockCopy());

        // #3 Add new styleUnitVarVals with one variable value in it
        const values = [{varName, value: newVal}];
        store2.dispatch('styleUnitVarVals/addItem', [{
            id,
            styleUnitMetaId: meta.id,
            values,
            generatedCss: varValsToString(values, id),
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
 * @param {String} newVal
 * @param {String} varName
 * @param {String} unitVarValsId
 * @param {UnitVarValue} curVarVals
 */
function updateValueAndEmit(newVal, varName, unitVarValsId, curV) {
    const updatedValue = {varName, value: newVal};
    const prevValue = {...curV};

    // Update value in styleUnitVarVals
    store2.dispatch('styleUnitVarVals/updateValueIn', [unitVarValsId, updatedValue]);

    store.dispatch(pushItemToOpQueue('update-style-unit-var-vals', {
        doHandle: () => { return 'http.put(todo /api/style-unit-var-vals)'; },
        doUndo: () => {
            store2.dispatch('styleUnitVarVals/updateValueIn', [unitVarValsId, prevValue]);
        },
        args: [],
    }));
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
 * @param {Array<String>} unitClses
 * @param {Array<StyleUnitVarValues>} allUnitVarVals
 * @returns {Array<StyleUnitVarValues>}
 */
function getUnitsVarValsFor(unitClses, allUnitVarVals) {
    const varValUnitsForThisBlock = allUnitVarVals.filter(unit => unitClses.indexOf(unit.id) > -1);
    return varValUnitsForThisBlock;
}

/**
 * @param {UnitVarMeta} vm
 * @param {Array<StyleUnitVarValues>} unitsVarVals
 * @param {StyleUnitMeta} sm
 * @returns {Array<UnitVarValue|null, StyleUnitVarValues|null>}
 */
function getVarValueFor(vm, unitsVarVals, sm) {
    const varVals = unitsVarVals.find(uv => uv.styleUnitMetaId === sm.id);
    if (!varVals)
        return [null, null];
    //
    const val = varVals.values.find(v2 => v2.varName === vm.varName);
    return [val, varVals];
}

/**
 * @param {Array<String>} clses
 * @returns {Array<String>}
 */
function onlyVarValUnitClasses(clses) {
    return clses.filter(cls => cls.startsWith('j-svv-'));
}

/**
 * @typedef StylesTab3Props
 * @prop {Boolean} isVisible
 * @prop todo todo
 */

export default BlockStylesTab3;
