import {__, api, http, timingUtils, env} from '@sivujetti-commons-for-edit-app';
import {varValsToString} from '../../block-styles/styleUnitVarValsStore.js';
import {cloneObjectDeep} from '../../block/theBlockTreeStore.js';
import store, {observeStore, pushItemToOpQueue, selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {valueEditors} from './VisualStyles.jsx';

const unitVarValClsPrefix = 'j-svv-';

class BlockStylesTab3 extends preact.Component {
    // unitVarValsIdMax;
    // saveVarVarStylesUrl;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        const {theme} = selectCurrentPageDataBundle(store.getState());
        this.unitVarValsIdMax = theme.styleUnitVarValuesIdMax;
        this.saveVarVarStylesUrl = `/api/themes/${theme.id}/style-units-var-vals`;
        this.unregistrables = [observeStore2('styleUnitVarVals', ({styleUnitVarVals}, [event]) => {
            if (event === 'styleUnitVarVals/init') return;
            this.updateUnitVarValues(styleUnitVarVals);
        }), observeStore(selectCurrentPageDataBundle, ({theme}) => {
            if (theme.styleUnitVarValuesIdMax !== this.unitVarValsIdMax)
                this.unitVarValsIdMax = theme.styleUnitVarValuesIdMax;
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
        //
        const throttledHandleValueChanged = timingUtils.debounce((newValAsString, valIsSet, mv, valHasUnit, sm, unitVarVals, v) => {
            if (newValAsString !== null) {
                const newVal = {varName: mv.varName, value: newValAsString};
                if (!valIsSet)
                    this.addValueAndEmit(newVal, valHasUnit ? unitVarVals.id : this.incrementAndGetNextId(), valHasUnit, sm);
                else
                    this.updateValueAndEmit(newVal, unitVarVals.id, v);
            } else {
                this.removeValueAndEmit();
            }
        }, env.normalTypingDebounceMillis);
        //
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
                    isClearable={ valIsSet }
                    labelTranslated={ __(mv.label) }
                    onVarValueChanged={ newValAsString => {
                        throttledHandleValueChanged(newValAsString, valIsSet, mv, valHasUnit, sm, unitVarVals, v);
                    } }
                    key={ `${sm.id}-${mv.id}-${mv.varName}` }/>;
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
     * @param {UnitVarValue} newVal
     * @param {String} unitVarValsId
     * @param {Boolean} alreadyHasUnit
     * @param {StyleUnitMeta} meta
     * @access private
     */
    addValueAndEmit(newVal, unitVarValsId, alreadyHasUnit, meta) {
        // The block, which newVal is being added to, already has unitVarVals, but this value is not its .values array -> add it
        if (alreadyHasUnit) {
            store2.dispatch('styleUnitVarVals/addValueTo', [unitVarValsId, newVal]);

            const toRemoveOnUndoContext = [unitVarValsId, newVal];
            this.dispatchNewUnitVarVals(() => {
                store2.dispatch('styleUnitVarVals/removeValueFrom', toRemoveOnUndoContext);
            });

        // The block, which newVal is being added to, has no unitVarVals yet -> add it using .values array [thisValue]
        } else {
            // #1 add related StyleUnitMeta's css to the page if not present?
            // store2.dispatch('styleUnitMetas/addItem', [{}]);

            // #2 Add class to the block
            this.props.emitAppendStrToBlockStyleClasses(`${meta.id} ${unitVarValsId}`, this.props.getBlockCopy());

            // #3 Add new styleUnitVarVals with one variable value in it
            const values = [newVal];
            const newVarVals = {
                id: unitVarValsId,
                styleUnitMetaId: meta.id,
                values,
                generatedCss: varValsToString(values, unitVarValsId),
            };
            store2.dispatch('styleUnitVarVals/addItem', [newVarVals]);

            this.dispatchNewUnitVarVals(() => {
                // Undo this (#3)
                store2.dispatch('styleUnitVarVals/removeItem', [unitVarValsId]);
                // Undo #2
                setTimeout(() => { api.saveButton.triggerUndo(); }, 100);
            });
        }
    }
    /**
     * @param {UnitVarValue} updatedValue
     * @param {String} unitVarValsId
     * @param {UnitVarValue} curVal
     * @access private
     */
    updateValueAndEmit(updatedValue, unitVarValsId, curVal) {
        const prevValue = {...curVal};

        store2.dispatch('styleUnitVarVals/updateValueIn', [unitVarValsId, updatedValue]);

        this.dispatchNewUnitVarVals(() => {
            store2.dispatch('styleUnitVarVals/updateValueIn', [unitVarValsId, prevValue]);
        });
    }
    /**
     * @param { } ? 
     * @param { } ? 
     * @access private
     */
    removeValueAndEmit(styleUnitMetaId, varName) {
        throw new Error('todo');
    }
    /**
     * @access private
     */
    updateUnitVarValues(styleUnitVarVals) {
        const block = this.props.getBlockCopy();
        const currentBlockVarValUnits = block ? getUnitsVarValsFor(onlyVarValUnitClasses(block.styleClasses.split(' ')), styleUnitVarVals) : null;
        this.setState({currentBlockVarValUnits});
    }
    /**
     * @param {() => void} doUndo
     * @access private
     */
    dispatchNewUnitVarVals(doUndo) {
        const updatedAll = store2.get().styleUnitVarVals;

        store.dispatch(pushItemToOpQueue('save-theme-style-units-var-vals', {
            doHandle: () => http.put(this.saveVarVarStylesUrl, {varValsItems: [...updatedAll]}),
            doUndo,
            args: [],
        }));
    }
    /**
     * @returns {String} Example 'j-svv-24'
     * @access private
     */
    incrementAndGetNextId() {
        const next = this.unitVarValsIdMax + 1;
        const bundle = cloneObjectDeep(selectCurrentPageDataBundle(store.getState()));
        bundle.theme.styleUnitVarValuesIdMax = next;
        store.dispatch(setCurrentPageDataBundle(bundle));
        return `${unitVarValClsPrefix}${next}`;
    }
}

/**
 * @param {String} blockTypeName
 * @param {Array<StyleUnitMeta>} allStylesMeta
 * @returns {Array<StyleUnitMeta>}
 */
function getStylesMetaFor(blockTypeName, allStylesMeta) {
    const styleUnitMetasForThisBlock = allStylesMeta.filter(sm => {
        const {suggestedFor} = sm;
        return suggestedFor.indexOf('all') > -1 || suggestedFor.indexOf(blockTypeName) > -1;
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
 * @returns {[UnitVarValue|null, StyleUnitVarValues|null]}
 */
function getVarValueFor(vm, unitsVarVals, sm) {
    const varVals = unitsVarVals.find(uv => uv.styleUnitMetaId === sm.id);
    if (!varVals)
        return [null, null];
    //
    const val = varVals.values.find(v2 => v2.varName === vm.varName);
    return [val || null, varVals];
}

/**
 * @param {Array<String>} clses
 * @returns {Array<String>}
 */
function onlyVarValUnitClasses(clses) {
    return clses.filter(cls => cls.startsWith(unitVarValClsPrefix));
}

/**
 * @typedef StylesTab3Props
 * @prop {Boolean} isVisible
 * @prop todo todo
 */

export default BlockStylesTab3;
