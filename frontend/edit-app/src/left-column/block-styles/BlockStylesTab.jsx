import {__, api, http, env, timingUtils, Icon} from '@sivujetti-commons-for-edit-app';
import {STYLE_INSTANCE_UNIT_CLS_PREFIX} from '../../block/dom-commons.js';
import {cloneObjectDeep} from '../../block/theBlockTreeStore.js';
import store, {pushItemToOpQueue, selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../../store.js';
import store2, {observeStore as observeStore2} from '../../store2.js';
import {valueEditors, compileScss} from '../block/VisualStyles.jsx';
import StyleTemplatesManager from './StyleUnitTemplateManager.jsx';

class BlockStylesTab extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({mode: 'show-instances'});
    }
    /**
     * @access protected
     */
    render(_, {mode}) {
        return [
            <button onClick={ this.changeDisplay.bind(this) }><Icon iconId="dots" className="size-xs"/></button>,
            mode === 'show-instances'
                ? <StyleInstanceUnits { ...this.props }/>
                : <StyleTemplatesManager { ...this.props }/>
        ];
    }
    /**
     * @access protected
     */
    changeDisplay() {
        const a = 'show-style-templates-manager';
        this.setState({mode: this.state.mode === a ? 'show-instances' : a});
    }
}

class StyleInstanceUnits extends preact.Component {
    // instantiateTemplateDropdown;
    // saveStyleUnitInstancesUrl;
    // unregistrables;
    /**
     * @access protected
     */
    componentWillMount() {
        this.instantiateTemplateDropdown = preact.createRef();
        const {theme} = selectCurrentPageDataBundle(store.getState());
        this.saveStyleUnitInstancesUrl = `/api/themes/${theme.id}/style-unit-instances`;
        if (this.props.isVisible) this.componentWillReceiveProps(this.props);
        this.unregistrables = [observeStore2('styleUnitInstances', (_, [event, data]) => {
            if (!this.state.currentBlockInfo) return;
            if (event === 'styleUnitInstances/removeItem')
                this.updateNewestStoreStateToState();
        })];
    }
    /**
     * @param {BlockStylesTabProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.isVisible && !this.state.inited) {
            const currentBlockInfo = {...props.currentBlockInfo};
            this.updateNewestStoreStateToState(currentBlockInfo);
        } else if (this.state.inited && !props.isVisible) {
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
    render(_, {currentBlockStyleTemplates, styleUnitBundles, inited}) {
        if (!inited) return;
        //
        const throttledHandleValueChanged = timingUtils.debounce(
        /**
         * @param {String} newValAsString
         * @param {Boolean} valIsSet
         * @param {UnitVarMeta} varMeta
         * @param {Boolean} valHasInstanceUnit
         * @param {StyleUnitTemplate} bu
         * @param {StyleUnitInstance|null} styleUnitInstance
         * @param {UnitVarValue} v
         */
        (newValAsString, valIsSet, {varName}, valHasInstanceUnit, bu, styleUnitInstance, v) => {
            const newVal = {varName, value: newValAsString};
            if (!valIsSet)
                this.addValuesAndEmit([newVal], valHasInstanceUnit, styleUnitInstance, bu);
            else
                this.updateValueAndEmit(newVal, styleUnitInstance.id, v, bu);
        }, env.normalTypingDebounceMillis);
        //
        return [this.props.useVisualStyles
            ? null
            : <div class="columns mx-0 mb-2">
                <select class="form-input form-select col-10" defaultValue={ currentBlockStyleTemplates[0].id } ref={ this.instantiateTemplateDropdown }>{ currentBlockStyleTemplates.map(({id, title}) => <option value={ id }>{ __(title) }</option>) }</select>
                <button class="col-ml-auto col-2" onClick={ () => this.addStyleInstanceUnit(currentBlockStyleTemplates.find(({id}) => id === this.instantiateTemplateDropdown.current.value)) } title={ __('Add style instance') }></button>
            </div>,
        ...(styleUnitBundles.length ? styleUnitBundles.map(({insOrTmpl, from, values}) => {
            const instance = from === 'instance' ? insOrTmpl : null;
            const bu = instance ? findTemplateFor(instance, currentBlockStyleTemplates) : insOrTmpl;
            const varMetas = bu.varMetas;
            const valuesFilled = instance !== null && !bu.isCommon
                ? values
                : bu.varMetas.map(varMeta =>
                    values.find(({varName}) => varName === varMeta.varName) || varMetaToValue(varMeta)
                );
            const key = `${bu.id}-${(instance || {id: 'nil'}).id}`;
            //
            return <div data-tag="details" class="style-vars-group p-1 mb-2" key={ key }>
                <div data-tag="summary">
                    { bu.title }
                    <button onClick={ e => 'this.openMoreMenu(vars, bu, e)' } class="btn btn-sm no-color p-absolute">
                        <Icon iconId="dots" className="size-xs"/>
                    </button>
                </div>
                <div class="has-color-pickers form-horizontal tight px-2 pt-0">
                { valuesFilled.map(val => {
                    const varMeta = varMetas.find(varMeta => varMeta.varName === val.varName);
                    const Renderer = valueEditors.get(varMeta.varType);
                    const valIsSet = val.value !== null;
                    const args = [...varMeta.args];
                    const valHasInstanceUnit = instance !== null;
                    const selector = varMeta.varType !== 'color'
                        ? null
                        : instance ? getSelectorFor(varMeta, instance) : '';
                    return <Renderer
                        varMetaCopy={ {...varMeta} }
                        valueAsString={ valIsSet ? val.value : null }
                        argsCopy={ [...args] }
                        varName={ varMeta.varName }
                        valueWrapStr={ varMeta.wrap }
                        isClearable={ valIsSet }
                        labelTranslated={ __(varMeta.varName) }
                        onVarValueChanged={ newValAsString => {
                            if (newValAsString !== null)
                                throttledHandleValueChanged(newValAsString, valIsSet, varMeta, valHasInstanceUnit, bu, insOrTmpl, val);
                            else
                                'this.removeValueAndEmit({varName: varMeta.varName, value: v ? v.value : varMeta.defaultValue}, styleUnitInstance)';
                        } }
                        selector={ selector }
                        key={ `${key}-${varMeta.varName}` }/>;
                }) }
                </div>
            </div>;
        }) : [<div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>])];
    }
    /**
     * @param {{id: String; type: String; styleClasses: String;}} currentBlockInfo = this.state.currentBlockInfo
     * @access private
     */
    updateNewestStoreStateToState(currentBlockInfo = this.state.currentBlockInfo) {
        const [currentBlockStyleTemplates, currentBlockTypeInstanceUnits] = getStylesFor(currentBlockInfo.type);
        const instanceClses = onlyInstanceUnitClasses(currentBlockInfo.styleClasses.split(' '));
        const currentBlockInstanceUnits = getInstanceUnitsFor(instanceClses, currentBlockTypeInstanceUnits);
        const styleUnitBundles = createStyleUnitBundles(currentBlockInstanceUnits, currentBlockStyleTemplates);
        this.setState({currentBlockStyleTemplates, styleUnitBundles, inited: true, currentBlockInfo});
    }
    /**
     * @param {Array<UnitVarValue>} newVals
     * @param {Boolean} instanceExists
     * @param {StyleUnitInstance|null} instance
     * @param {StyleUnitTemplate} template
     * @access private
     */
    addValuesAndEmit(newVals, instanceExists, instance, template) {
        //
        if (instanceExists)
            this.addValuesToInstanceUnitAndEmit(newVals, instance, template);
        //
        else
            this.addStyleInstanceUnit(template, vals => vals.map(v1 =>
                newVals.find(v => v.varName === v1.varName) || v1
            ));
    }
    /**
     * @param {Array<UnitVarValue>} newVals
     * @param {StyleUnitInstance|null} instance
     * @param {StyleUnitTemplate} template
     * @access private
     */
    addValuesToInstanceUnitAndEmit(newVals, instance, template) {
        const unitId = instance.id;
        const current = store2.get().styleUnitInstances.find(({id}) => id === unitId);
        const merged = [...current.values, ...newVals]; // ?? 
        const newGenerated = generateCssFromVals(merged, unitId, template);
        store2.dispatch('styleUnitInstances/updateValuesOf', [unitId, merged, newGenerated]);
    }
    /**
     * @param {UnitVarValue} newVal
     * @param {String|} instanceId
     * @param {UnitVarValue} curVal
     * @param {StyleUnitTemplate} template
     * @access private
     */
    updateValueAndEmit(newVal, instanceId, curVal, template) {
        const current = store2.get().styleUnitInstances.find(({id}) => id === instanceId);
        const updated = current.values.map(v => v.varName !== newVal.varName ? v : newVal); // ?? 
        const newGenerated = generateCssFromVals(updated, instanceId, template);
        store2.dispatch('styleUnitInstances/updateValuesOf', [instanceId, updated, newGenerated]);
    }
    /**
     * @access private
     */
    unload() {
        this.setState({currentBlockStyleTemplates: null, styleUnitBundles: null, inited: false, currentBlockInfo: null});
    }
    /**
     * @param todo(styleReimpl)
     * @access private
     */
    addStyleInstanceUnit(styleTemplate, patchValues = null) {
        const values1 = styleTemplate.varMetas.map(varMetaToValue);
        const values = !patchValues ? values1 : patchValues(values1);

        const {theme} = selectCurrentPageDataBundle(store.getState());
        const next = theme.styleUnitInstanceIdMax + 1;
        const bundle = cloneObjectDeep(selectCurrentPageDataBundle(store.getState()));
        bundle.theme.styleUnitInstanceIdMax = next;
        store.dispatch(setCurrentPageDataBundle(bundle));
        const id = `${STYLE_INSTANCE_UNIT_CLS_PREFIX}${styleTemplate.isFor}-${next}`;
        const newItem = {
            id,
            describedBy: styleTemplate.id,
            values,
            generatedCss: generateCssFromVals(values, id, styleTemplate),
        };

        // #1 Add class to the block
        const block = undefined; // means current block
        const newClses = this.props.emitAppendStrToBlockStyleClasses(newItem.id, block);
        const prevBlockInfo = {...this.state.currentBlockInfo};
        const newBlockInfo = {...this.state.currentBlockInfo, ...{styleClasses: newClses}};

        // #2
        store2.dispatch('styleUnitInstances/addItem', [newItem]);
        this.updateNewestStoreStateToState(newBlockInfo);

        const latest = [...store2.get().styleUnitInstances];
        store.dispatch(pushItemToOpQueue('save-theme-style-unit-instances', {
            doHandle: () => http.put(this.saveStyleUnitInstancesUrl, {styleUnitInstances: latest}),
            doUndo: () => {
                // Undo this (#3)
                this.setState({currentBlockInfo: prevBlockInfo});
                store2.dispatch('styleUnitInstances/removeItem', [id]);
                // Undo #2
                setTimeout(() => { api.saveButton.triggerUndo(); }, 100);
            },
            args: [],
        }));
    }
}

/**
 * @param {Array<UnitVarValue>} values
 * @param {String} instanceId
 * @param {StyleUnitTemplate} styleTmpl
 * @returns {String}
*/
function generateCssFromVals(values, instanceId, styleTmpl) {
    const getVarMetaFor = (v, frm) => frm.find(vm => vm.varName === v.varName);
    return values.filter(v => !!v.value).map(v => {
        const varMeta = getVarMetaFor(v, styleTmpl.varMetas);
        const scss = varMeta.wrap.indexOf('%s') > -1 // todo(styleReimpl) deprecate
            ? varMeta.wrap.replace(/%s/g, v.value)
            : varMeta.wrap.replace(new RegExp(`\\$${v.varName}`, 'g'), v.value);
        return compileScss(scss, instanceId);
    }).join('\n');
}

/**
 * @param {String} blockTypeName
 * @param {{styleUnitTemplates: Array<StyleUnitTemplate>; styleUnitInstances: Array<StyleUnitInstance>;}} data
 * @returns {[Array<StyleUnitTemplate>, Array<StyleUnitInstance>]}
 */
function getStylesFor(blockTypeName, {styleUnitTemplates, styleUnitInstances} = store2.get()) {
    const styleUnitTemplatesForThisBlockType = styleUnitTemplates.filter(({isFor}) =>
        isFor === blockTypeName
    );
    const styleUnitInstancesForThisBlockType = styleUnitInstances.filter(ins =>
        // ['j', 'Button' , 'base' '3']
        ins.describedBy.split('-')[1] === blockTypeName
    );
    return [styleUnitTemplatesForThisBlockType, styleUnitInstancesForThisBlockType];
}

/**
 * todo(styleReimpl)
 */
function createStyleUnitBundles(currentBlockInstanceUnits, currentBlockStyleTemplates) {
    return [
        ...currentBlockInstanceUnits.map(ins =>
            ({values: ins.values, insOrTmpl: ins, from: 'instance'})
        ),
        ...currentBlockStyleTemplates.filter(tmpl => tmpl.isCommon && !currentBlockInstanceUnits.some(ins => ins.describedBy === tmpl.id)).map(tmpl =>
            ({values: tmpl.varMetas.map(varMetaToValue), insOrTmpl: tmpl, from: 'template'})
        )
    ];
}

/**
 * todo(styleReimpl)
 */
function varMetaToValue(varMeta) {
    return {varName: varMeta.varName, value: null};
}

/**
 * @param {Array<String>} clses
 * @returns {Array<String>}
 */
function onlyInstanceUnitClasses(clses) {
    return clses.filter(cls => cls.startsWith(STYLE_INSTANCE_UNIT_CLS_PREFIX));
}

/**
 * @param {Array<String>} unitClses
 * @param {Array<StyleUnitInstance>} instancesForCurrentBlockType
 * @returns {Array<StyleUnitInstance>}
 */
function getInstanceUnitsFor(unitClses, instancesForCurrentBlockType) {
    const forThisBlock = instancesForCurrentBlockType.filter(unit => unitClses.indexOf(unit.id) > -1);
    return forThisBlock;
}

/**
 * @param {UnitVarMeta} varMeta
 * @param {Array<StyleUnitInstance>} styleUnitInstances
 * @param {StyleUnitTemplate} styleUnitTemplate
 * @returns {[UnitVarValue|null, StyleUnitInstance|null]}
 */
function getVarValueFor({varName}, styleUnitInstances, {id}) {
    const varUnit = styleUnitInstances.find(uv => uv.describedBy === id);
    if (!varUnit)
        return [null, null];
    //
    const val = varUnit.values.find(v2 => v2.varName === varName);
    return [val || null, varUnit];
}

function findTemplateFor(styleUnitInstance, templates) {
    return templates.find(t => t.id === styleUnitInstance.describedBy);
}

/**
 * todo(styleReimpl)
 */
function getSelectorFor(varMeta, instance) {
    // todo(styleReimpl) implement properly

    // 'position: relative;\n&:before { content: \"\"; background-color: $cover; ... }\n> * { position: relative; }'
    if (instance.describedBy.startsWith('j-Section-'))
        return `.${instance.id}:before`;
    // '&:hover { background: \$backgroundHover; }'
    else if (instance.describedBy.startsWith('j-Button-'))
        return !varMeta.wrap.startsWith('&:') ? `.${instance.id}` : varMeta.wrap.replace('&', instance.id);
    // 'background: \$backgroundNormal;'
    return `.${instance.id}`;
}

/**
 * @typedef BlockStylesTabProps
 * @prop {Boolean} isVisible
 * @prop todo(styleReimpl) todo(styleReimpl)
 */

export default BlockStylesTab;
