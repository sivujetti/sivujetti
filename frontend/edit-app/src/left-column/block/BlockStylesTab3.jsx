import {__, api, http, timingUtils, env, Icon} from '@sivujetti-commons-for-edit-app';
import {varValsToString} from '../../block-styles/styleUnitVarValsStore.js';
import {VAR_UNIT_CLS_PREFIX} from '../../block/dom-commons.js';
import {cloneObjectDeep} from '../../block/theBlockTreeStore.js';
import store, {observeStore, pushItemToOpQueue, selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {valueEditors} from './VisualStyles.jsx';

class BlockStylesTab3 extends preact.Component {
    // unitVarValsIdMax;
    // saveVarValStylesUrl;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        const {theme} = selectCurrentPageDataBundle(store.getState());
        this.unitVarValsIdMax = theme.styleUnitVarValuesIdMax;
        this.saveVarValStylesUrl = `/api/themes/${theme.id}/style-units-var-vals`;
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
            const {blockTypeName} = this.props;
            const block = blockTypeName ? props.getBlockCopy() : null;
            const [currentBlockStylesMetaIr, allBlockVarValUnits] = block
                ? getStylesInfo(block)
                : [null, null];
            const [currentBlockStylesMeta, currentBlockVarValUnits] = currentBlockStylesMetaIr
                ? [currentBlockStylesMetaIr, getUnitsVarValsFor(onlyVarValUnitClasses(block.styleClasses.split(' ')), allBlockVarValUnits)]
                : [null, null];
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
            const newVal = {varName: mv.varName, value: newValAsString};
            if (!valIsSet)
                this.addValueAndEmit(newVal, valHasUnit ? unitVarVals.id : this.incrementAndGetNextId(), valHasUnit, sm);
            else
                this.updateValueAndEmit(newVal, unitVarVals.id, v);
        }, env.normalTypingDebounceMillis);
        //
        return currentBlockStylesMeta.length ? currentBlockStylesMeta.map(sm => {
            const vars = sm.vars.map(mv => getVarValueFor(mv, currentBlockVarValUnits, sm));
            const firstVarUnit = vars[0] ? vars[0][1] : null;
            return <div data-tag="details" class="style-vars-group p-1 mb-2" key={ sm.id } open>
            <div data-tag="summary">
                { sm.title }{ firstVarUnit && firstVarUnit.defaultFor ? <span> (default)</span> : null }
                <button onClick={ () => { // todo context menu
                    this.setVarUnitAsDefault(vars[0][1], sm);
                } } class={ `btn btn-sm no-color p-absolute${firstVarUnit && !firstVarUnit.defaultFor ? '' : ' d-none'}` }>
                    <Icon iconId="dots" className="size-xs"/>
                </button>
            </div>
            { vars.map(([v, unitVarVals], i) => {
                const mv = sm.vars[i];
                const Renderer = valueEditors.get(mv.type);
                const valHasUnit = unitVarVals !== null; // var is described in StyleUnitMeta, but has no StyleUnitVarVals yet
                const args = [...mv.args];
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
                        if (newValAsString !== null)
                            throttledHandleValueChanged(newValAsString, valIsSet, mv, valHasUnit, sm, unitVarVals, v);
                        else
                            this.removeValueAndEmit({varName: mv.varName, value: v ? v.value : mv.defaultValue}, unitVarVals);
                    } }
                    key={ `${sm.id}-${mv.id}-${mv.varName}` }/>;
            }) }
            </div>;
        }) : <div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>;
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
                // omit defaultFor
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
     * @param {UnitVarValue} curVal
     * @param {StyleUnitVarValues} curUnit
     * @access private
     */
    removeValueAndEmit(curVal, curUnit) {
        const valueToRestoreOnUndo = {...curVal};
        const unitVarValsId = curUnit.id;
        const wasLastVar = store2.get().styleUnitVarVals.find(uv => uv.id === unitVarValsId).values.length === 1;
        let prevUnit = null;

        // #1
        store2.dispatch('styleUnitVarVals/removeValueFrom', [unitVarValsId, {varName: curVal.varName, value: null}]);

        // #2
        if (wasLastVar) {
            this.props.emitRemoveClassFromBlockStyleClasses(`${unitVarValsId}`, this.props.getBlockCopy());
            prevUnit = {...curUnit};
        }

        // #3 todo remove meta class if <what>?

        this.dispatchNewUnitVarVals(() => {
            if (!wasLastVar) {
                // #1
                store2.dispatch('styleUnitVarVals/addValueTo', [unitVarValsId, valueToRestoreOnUndo]);
            } else {
                // #2
                setTimeout(() => { api.saveButton.triggerUndo(); }, 1);
                // #1
                setTimeout(() => { store2.dispatch('styleUnitVarVals/addItem', [prevUnit]); }, 2);
            }
        });
    }
    /**
     * @param {StyleUnitVarValues} styleUnitVarVals
     * @param {StyleUnitMeta} meta
     * @access private
     */
    setVarUnitAsDefault(styleUnitVarVals, meta) {
        let isDefaultFor = 'auto';
        if (meta.suggestedFor.toString() === 'all')
            isDefaultFor = prompt('This unit is taregted for all block types. Set this default only for?');

        const previous = {...styleUnitVarVals};
        const updated = {...styleUnitVarVals};
        updated.defaultFor = isDefaultFor;
        store2.dispatch('styleUnitVarVals/updateItem', [updated]);

        this.dispatchNewUnitVarVals(() => {
            store2.dispatch('styleUnitVarVals/updateItem', [previous]);
        });
    }
    /**
     * @param {StyleUnitVarValues} styleUnitVarVals
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
            doHandle: () => http.put(this.saveVarValStylesUrl, {varValsItems: [...updatedAll]}),
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
        return `${VAR_UNIT_CLS_PREFIX}${next}`;
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
    return clses.filter(cls => cls.startsWith(VAR_UNIT_CLS_PREFIX));
}

/**
 * @param {RawBlock} block
 * @returns {[Array<StyleUnitMeta>, Array<StyleUnitVarValues>]}
 */
function getStylesInfo(block) {
    const {styleUnitMetas, styleUnitVarVals} = store2.get();
    const stylesMeta = getStylesMetaFor(block.type, styleUnitMetas);
    return [stylesMeta, styleUnitVarVals];
}

/**
 * @typedef StylesTab3Props
 * @prop {Boolean} isVisible
 * @prop todo todo
 */

export default BlockStylesTab3;
export {getStylesInfo};
