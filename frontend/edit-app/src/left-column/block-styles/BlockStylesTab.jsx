import {__, env, timingUtils, Icon} from '@sivujetti-commons-for-edit-app';
import {STYLE_INSTANCE_UNIT_CLS_PREFIX} from '../../block/dom-commons.js';
import {cloneObjectDeep} from '../../block/theBlockTreeStore.js';
import store, {selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../../store.js';
import store2 from '../../store2.js';
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
                ? <StyleUnitInstances { ...this.props }/>
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

class StyleUnitInstances extends preact.Component {
    // unregistrables;
    // instantiateTemplateDropdown;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
        this.instantiateTemplateDropdown = preact.createRef();
        if (this.props.isVisible) this.componentWillReceiveProps(this.props);
    }
    /**
     * @param {BlockStylesTabProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.isVisible && !this.state.inited) {
            const currentBlockTypeName = props.getBlockCopy().type;
            this.updateNewestStoreStateToState(currentBlockTypeName);
        } else if (!props.isVisible && this.state.inited) {
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
            const bu = from === 'instance' ? findTemplateFor(insOrTmpl, currentBlockStyleTemplates) : insOrTmpl;
            const varMetas = bu.varMetas;
            const valuesFilled = from === 'instance' && !bu.isCommon
                ? values
                : bu.varMetas.map(varMeta =>
                    values.find(({varName}) => varName === varMeta.varName) || varMetaToValue(varMeta)
                );
            //
            return <div data-tag="details" class="style-vars-group p-1 mb-2" key={ bu.id }>
                <div data-tag="summary">
                    { bu.title }
                    <button onClick={ e => 'this.openMoreMenu(vars, bu, e)' } class="btn btn-sm no-color p-absolute">
                        <Icon iconId="dots" className="size-xs"/>
                    </button>
                </div>
                <div class="has-color-pickers form-horizontal tight px-2 pt-0" key={ bu.id }>
                { valuesFilled.map(val => {
                    const varMeta = varMetas.find(varMeta => varMeta.varName === val.varName);
                    const Renderer = valueEditors.get(varMeta.varType);
                    const valIsSet = val.value !== null;
                    const args = [...varMeta.args];
                    const valHasInstanceUnit = from === 'instance';
                    const selector = varMeta.varType !== 'color'
                        ? null
                        : from === 'instance' ? getSelectorFor(varMeta, insOrTmpl) : '';
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
                        key={ `${bu.id}-${varMeta.varName}` }/>;
                }) }
                </div>
            </div>;
        }) : [<div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>])];
    }
    /**
     * @param {String} currentBlockTypeName = this.state.currentBlockTypeName
     * @access private
     */
    updateNewestStoreStateToState(currentBlockTypeName = this.state.currentBlockTypeName) {
        const [currentBlockStyleTemplates, currentBlockInstanceUnits] = getStylesFor(currentBlockTypeName);
        const styleUnitBundles = createStyleUnitBundles(currentBlockInstanceUnits, currentBlockStyleTemplates);
        this.setState({currentBlockStyleTemplates, styleUnitBundles, inited: true, currentBlockTypeName});
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
        this.setState({currentBlockStyleTemplates: null, styleUnitBundles: null, inited: false, currentBlockTypeName: null});
    }
    /**
     * @access private
     */
    addStyleInstanceUnit(styleTemplate, t = null) {
        const values1 = styleTemplate.varMetas.map(varMetaToValue);
        const values = !t ? values1 : t(values1);

        const {theme} = selectCurrentPageDataBundle(store.getState());
        const next = theme.styleUnitInstanceIdMax + 1;
        const bundle = cloneObjectDeep(selectCurrentPageDataBundle(store.getState()));
        bundle.theme.styleUnitInstanceIdMax = next;
        store.dispatch(setCurrentPageDataBundle(bundle));
        const id = `${STYLE_INSTANCE_UNIT_CLS_PREFIX}${styleTemplate.isFor}-${next}`;

        store2.dispatch('styleUnitInstances/addItem', [{
            id,
            describedBy: styleTemplate.id,
            values,
            generatedCss: generateCssFromVals(values, id, styleTemplate),
        }]);
        this.updateNewestStoreStateToState();
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
    const styleUnitTemplatesForThisBlock = styleUnitTemplates.filter(({isFor}) =>
        isFor === blockTypeName
    );
    const styleUnitInstancesForThisBlock = styleUnitInstances.filter(ins =>
        // ['j', 'Button' , 'base' '3']
        ins.describedBy.split('-')[1] === blockTypeName
    );
    return [styleUnitTemplatesForThisBlock, styleUnitInstancesForThisBlock];
}

/**
 * todo(styleReimpl)
 */
function createStyleUnitBundles(currentBlockInstanceUnits, currentBlockStyleTemplates) {
    return [
        ...currentBlockInstanceUnits.map(ins =>
            ({values: ins.values, insOrTmpl: ins, from: 'instance'}))
        ,
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
function onlyVarValUnitClasses(clses) {
    return clses.filter(cls => cls.startsWith(STYLE_INSTANCE_UNIT_CLS_PREFIX));
}

/**
 * @param {Array<String>} unitClses
 * @param {Array<StyleUnitInstance>} allVarUnits
 * @returns {Array<StyleUnitInstance>}
 */
function getStyleUnitInstancesFor(unitClses, allVarUnits) {
    const varValUnitsForThisBlock = allVarUnits.filter(unit => unitClses.indexOf(unit.id) > -1);
    return varValUnitsForThisBlock;
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

    // 'position: relative;\n&:before { content: \"\"; background-color: %s; ... }\n> * { position: relative; }'
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
