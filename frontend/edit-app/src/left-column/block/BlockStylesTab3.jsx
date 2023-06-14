import {__, api, http, timingUtils, env, Icon} from '@sivujetti-commons-for-edit-app';
import {varStyleUnitToString} from '../../block-styles/varStyleUnitsStore.js';
import {BASE_UNIT_CLS_PREFIX, VAR_UNIT_CLS_PREFIX} from '../../block/dom-commons.js';
import {cloneObjectDeep} from '../../block/theBlockTreeStore.js';
import store, {observeStore, pushItemToOpQueue, selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {valueEditors, comp} from './VisualStyles.jsx';

class BlockStylesTab3 extends preact.Component {
    // varStyleUnitIdMax;
    // saveVarValStylesUrl;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        const {theme} = selectCurrentPageDataBundle(store.getState());
        this.varStyleUnitIdMax = theme.varStyleUnitIdMax;
        this.saveVarValStylesUrl = `/api/themes/${theme.id}/var-style-units`;
        this.unregistrables = [observeStore2('varStyleUnits', ({varStyleUnits}, [event]) => {
            if (event === 'varStyleUnits/init') return;
            this.updateUnitVarValues(varStyleUnits);
        }), observeStore(selectCurrentPageDataBundle, ({theme}) => {
            if (theme.varStyleUnitIdMax !== this.varStyleUnitIdMax)
                this.varStyleUnitIdMax = theme.varStyleUnitIdMax;
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
            const [currentBlockBaseUnitsIr, allBlockVarValUnits] = block
                ? getStylesInfo(block)
                : [null, null];
            const [currentBlockBaseUnits, currentBlockVarValUnits] = currentBlockBaseUnitsIr
                ? [currentBlockBaseUnitsIr, getVarStyleUnitsFor(onlyVarValUnitClasses(block.styleClasses.split(' ')), allBlockVarValUnits)]
                : [null, null];
            this.setState({currentBlockBaseUnits, currentBlockVarValUnits, initd: true});
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
    render(_, {currentBlockBaseUnits, currentBlockVarValUnits, initd}) {
        if (!initd) return;
        //
        const throttledHandleValueChanged = timingUtils.debounce(
        /**
         * @param {String} newValAsString
         * @param {Boolean} valIsSet
         * @param {UnitVarMeta} varMeta
         * @param {String} newValAsString
         * @param {Boolean} valHasUnit
         * @param {BaseStyleUnit} bu
         * @param {VarStyleUnit} varStyleUnit
         * @param {UnitVarValue} v
         */
        (newValAsString, valIsSet, {varName}, valHasUnit, bu, varStyleUnit, v) => {
            const newVal = {varName, value: newValAsString};
            if (!valIsSet)
                this.addValueAndEmit(newVal, valHasUnit ? varStyleUnit.id : this.incrementAndGetNextId(), valHasUnit, bu);
            else
                this.updateValueAndEmit(newVal, varStyleUnit.id, v);
        }, env.normalTypingDebounceMillis);
        //
        return currentBlockBaseUnits.length ? currentBlockBaseUnits.map(bu => {
            const vars = bu.vars.map(varMeta => getVarValueFor(varMeta, currentBlockVarValUnits, bu));
            const firstVarUnit = vars[0] ? vars[0][1] : null;
            return <div data-tag="details" class="style-vars-group p-1 mb-2" key={ bu.id } open>
            <div data-tag="summary">
                { bu.title }{ firstVarUnit && firstVarUnit.defaultFor ? <span> (default)</span> : null }
                <button onClick={ () => { // todo context menu
                    this.setVarUnitAsDefault(vars[0][1], bu);
                } } class={ `btn btn-sm no-color p-absolute${firstVarUnit && !firstVarUnit.defaultFor ? '' : ' d-none'}` }>
                    <Icon iconId="dots" className="size-xs"/>
                </button>
            </div>
            { vars.map(([v, varStyleUnit], i) => {
                const varMeta = bu.vars[i];
                const Renderer = valueEditors.get(varMeta.type);
                const valHasUnit = varStyleUnit !== null; // var is described in BaseStyleUnit, but has no VarStyleUnit yet
                const args = [...varMeta.args];
                const valIsSet = v !== null;
                return <Renderer
                    metaCopy={ {...varMeta} }
                    valueAsString={ v ? v.value : null }
                    argsCopy={ [...args] }
                    varName={ varMeta.varName }
                    valueWrapStr={ '' }
                    valHasUnit={ valHasUnit }
                    isClearable={ valIsSet }
                    labelTranslated={ __(varMeta.label) }
                    onVarValueChanged={ newValAsString => {
                        if (newValAsString !== null)
                            throttledHandleValueChanged(newValAsString, valIsSet, varMeta, valHasUnit, bu, varStyleUnit, v);
                        else
                            this.removeValueAndEmit({varName: varMeta.varName, value: v ? v.value : varMeta.defaultValue}, varStyleUnit);
                    } }
                    key={ `${bu.id}-${varMeta.id}-${varMeta.varName}` }/>;
            }) }
            </div>;
        }) : <div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>;
    }
    /**
     * @access private
     */
    unload() {
        this.setState({currentBlockBaseUnits: null, currentBlockVarValUnits: null, initd: false});
    }
    /**
     * @param {UnitVarValue} newVal
     * @param {String} varStyleUnitId
     * @param {Boolean} alreadyHasUnit
     * @param {BaseStyleUnit} baseUnit
     * @access private
     */
    addValueAndEmit(newVal, varStyleUnitId, alreadyHasUnit, baseUnit) {
        // The block, which newVal is being added to, already has VarStyleUnit, but this value is not its .values array -> add it
        if (alreadyHasUnit) {
            store2.dispatch('varStyleUnits/addValueTo', [varStyleUnitId, newVal]);

            const toRemoveOnUndoContext = [varStyleUnitId, newVal];
            this.dispatchNewVarStyles(() => {
                store2.dispatch('varStyleUnits/removeValueFrom', toRemoveOnUndoContext);
            });

        // The block, which newVal is being added to, has no VarStyleUnit yet -> add it using .values array [thisValue]
        } else {
            // #1 add related BaseStyleUnit's css to the page if not present?
            // store2.dispatch('baseStyleUnits/addItem', [{}]);

            // #2 Add class to the block
            this.props.emitAppendStrToBlockStyleClasses(`${baseUnit.id} ${varStyleUnitId}`, this.props.getBlockCopy());

            // #3 Add new VarStyleUnit with one variable value in it
            const values = [newVal];
            const newVarStyleUnit = {
                id: varStyleUnitId,
                baseStyleUnitId: baseUnit.id,
                values,
                generatedCss: varStyleUnitToString(values, varStyleUnitId),
                // omit defaultFor
            };
            store2.dispatch('varStyleUnits/addItem', [newVarStyleUnit]);

            this.dispatchNewVarStyles(() => {
                // Undo this (#3)
                store2.dispatch('varStyleUnits/removeItem', [varStyleUnitId]);
                // Undo #2
                setTimeout(() => { api.saveButton.triggerUndo(); }, 100);
            });
        }
    }
    /**
     * @param {UnitVarValue} updatedValue
     * @param {String} varStyleUnitId
     * @param {UnitVarValue} curVal
     * @access private
     */
    updateValueAndEmit(updatedValue, varStyleUnitId, curVal) {
        const prevValue = {...curVal};

        store2.dispatch('varStyleUnits/updateValueIn', [varStyleUnitId, updatedValue]);

        this.dispatchNewVarStyles(() => {
            store2.dispatch('varStyleUnits/updateValueIn', [varStyleUnitId, prevValue]);
        });
    }
    /**
     * @param {UnitVarValue} curVal
     * @param {VarStyleUnit} curUnit
     * @access private
     */
    removeValueAndEmit(curVal, curVarsUnit) {
        const valueToRestoreOnUndo = {...curVal};
        const varStyleUnitId = curVarsUnit.id;
        const wasLastVar = store2.get().varStyleUnits.find(({id}) => id === varStyleUnitId).values.length === 1;
        let prevUnit = null;

        // #1
        store2.dispatch('varStyleUnits/removeValueFrom', [varStyleUnitId, {varName: curVal.varName, value: null}]);

        // #2
        if (wasLastVar) {
            this.props.emitRemoveClassFromBlockStyleClasses(`${varStyleUnitId}`, this.props.getBlockCopy());
            prevUnit = {...curVarsUnit};
        }

        // #3 todo remove base class if <what>?

        this.dispatchNewVarStyles(() => {
            if (!wasLastVar) {
                // #1
                store2.dispatch('varStyleUnits/addValueTo', [varStyleUnitId, valueToRestoreOnUndo]);
            } else {
                // #2
                setTimeout(() => { api.saveButton.triggerUndo(); }, 1);
                // #1
                setTimeout(() => { store2.dispatch('varStyleUnits/addItem', [prevUnit]); }, 2);
            }
        });
    }
    /**
     * @param {VarStyleUnit} varStyleUnit
     * @param {BaseStyleUnit} styleBase
     * @access private
     */
    setVarUnitAsDefault(varStyleUnit, styleBase) {
        let isDefaultFor = 'auto';
        if (styleBase.suggestedFor.toString() === 'all')
            isDefaultFor = prompt('This unit is taregted for all block types. Set this default only for?');

        const previous = {...varStyleUnit};
        const updated = {...varStyleUnit};
        updated.defaultFor = isDefaultFor;
        store2.dispatch('varStyleUnits/updateItem', [updated]);

        this.dispatchNewVarStyles(() => {
            store2.dispatch('varStyleUnits/updateItem', [previous]);
        });
    }
    /**
     * @param {VarStyleUnit} varStyleUnit
     * @access private
     */
    updateUnitVarValues(varStyleUnit) {
        const block = this.props.getBlockCopy();
        const currentBlockVarValUnits = block ? getVarStyleUnitsFor(onlyVarValUnitClasses(block.styleClasses.split(' ')), varStyleUnit) : null;
        this.setState({currentBlockVarValUnits});
    }
    /**
     * @param {() => void} doUndo
     * @access private
     */
    dispatchNewVarStyles(doUndo) {
        const updatedAll = store2.get().varStyleUnits;

        store.dispatch(pushItemToOpQueue('save-theme-var-style-units', {
            doHandle: () => http.put(this.saveVarValStylesUrl, {varStyleUnits: [...updatedAll]}),
            doUndo,
            args: [],
        }));
    }
    /**
     * @returns {String} Example 'j-vu-24'
     * @access private
     */
    incrementAndGetNextId() {
        const next = this.unitStyleUnitIdMax + 1;
        const bundle = cloneObjectDeep(selectCurrentPageDataBundle(store.getState()));
        bundle.theme.varStyleUnitIdMax = next;
        store.dispatch(setCurrentPageDataBundle(bundle));
        return `${VAR_UNIT_CLS_PREFIX}${next}`;
    }
}

/**
 * @param {String} blockTypeName
 * @param {Array<BaseStyleUnit>} allBaseUnits
 * @returns {Array<BaseStyleUnit>}
 */
function getBaseUnitsFor(blockTypeName, allBaseUnits) {
    const baseStyleUnitsForThisBlock = allBaseUnits.filter(bu => {
        const {suggestedFor} = bu;
        return suggestedFor.indexOf('all') > -1 || suggestedFor.indexOf(blockTypeName) > -1;
    });
    return baseStyleUnitsForThisBlock;
}

/**
 * @param {Array<String>} unitClses
 * @param {Array<VarStyleUnit>} allVarUnits
 * @returns {Array<VarStyleUnit>}
 */
function getVarStyleUnitsFor(unitClses, allVarUnits) {
    const varValUnitsForThisBlock = allVarUnits.filter(unit => unitClses.indexOf(unit.id) > -1);
    return varValUnitsForThisBlock;
}

/**
 * @param {UnitVarMeta} varMeta
 * @param {Array<VarStyleUnit>} varStyleUnits
 * @param {BaseStyleUnit} baseStyleUnit
 * @returns {[UnitVarValue|null, VarStyleUnit|null]}
 */
function getVarValueFor({varName}, varStyleUnits, {id}) {
    const varUnit = varStyleUnits.find(uv => uv.baseStyleUnitId === id);
    if (!varUnit)
        return [null, null];
    //
    const val = varUnit.values.find(v2 => v2.varName === varName);
    return [val || null, varUnit];
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
 * @returns {[Array<BaseStyleUnit>, Array<VarStyleUnit>]}
 */
function getStylesInfo(block) {
    const {baseStyleUnits, varStyleUnits} = store2.get();
    const baseUnits = getBaseUnitsFor(block.type, baseStyleUnits);
    return [baseUnits, varStyleUnits];
}

/**
 * @typedef StylesTab3Props
 * @prop {Boolean} isVisible
 * @prop todo todo
 */

export default BlockStylesTab3;
export {getStylesInfo};
