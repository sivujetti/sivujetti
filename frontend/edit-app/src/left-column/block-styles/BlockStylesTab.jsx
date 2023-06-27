import {__, env, timingUtils, Icon} from '@sivujetti-commons-for-edit-app';
import {VAR_UNIT_CLS_PREFIX} from '../../block/dom-commons.js';
import store2 from '../../store2.js';
import {EditableTitle} from '../block/BlockStylesTab.jsx';
import {valueEditors} from '../block/VisualStyles.jsx';

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

class StyleTemplatesManager extends preact.Component {
    /**
     * @param {BlockStylesTabProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.isVisible && !this.state.inited) {
            this.setState({styleUnitTemplates: store2.get().styleUnitTemplates, inited: true});
        } else if (!props.isVisible && this.state.inited) {
            this.unload();
        }
    }
    /**
     * @access protected
     */
    render(_, {styleUnitTemplates, inited}) {
        if (!inited) return null;
        return [<ul class="list styles-list mb-2">{ styleUnitTemplates.map((unit, i) => {
            const liCls = '';
            const isDefault = false;
            const title = unit.title;
            return <li class={ liCls } key={ unit.id }>
                <header class="flex-centered p-relative">
                    <button
                        onClick={ e => this.handleLiClick(e, i, isDefault) }
                        class="col-12 btn btn-link text-ellipsis with-icon pl-2 mr-1 no-color"
                        type="button">
                        <Icon iconId="chevron-down" className="size-xs"/>
                        <EditableTitle
                            unitId={ unit.id }
                            unitIdReal={ null }
                            currentTitle={ title }
                            blockCopy={ this.blockCopy }
                            userCanEditCss={ true }
                            subtitle={ null }/>
                    </button>
                </header>
            </li>;
        }) }</ul>, <button
            onClick={ () => this.addStyleTemplate.bind(this) }
            class="btn btn-primary btn-sm mr-1"
            type="button">{ __('Add style template') }</button>
        ];
    }
    /**
     * @access private
     */
    addStyleTemplate() {
        // todo
    }
    /**
     * @access private
     */
    unload() {
        this.setState({styleUnitTemplates: null, inited: false});
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
            const block = props.getBlockCopy();
            const [currentBlockStyleTemplates, currentBlockInstanceUnits] = getStylesFor(block.type);
            const styleUnitBundles = createStyleUnitBundles(currentBlockInstanceUnits, currentBlockStyleTemplates);
            this.setState({currentBlockStyleTemplates, styleUnitBundles, inited: true});
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
         * @param {String} newValAsString
         * @param {Boolean} valHasUnit
         * @param {StyleUnitTemplate} bu
         * @param {StyleUnitInstance|null} styleUnitInstance
         * @param {UnitVarValue} v
         */
        (newValAsString, valIsSet, {varName}, valHasUnit, bu, styleUnitInstance, v) => {
            const newVal = {varName, value: newValAsString};
            if (!valIsSet)
                this.addValuesAndEmit([newVal], valHasUnit, styleUnitInstance, bu);
            else
                this.updateValueAndEmit(newVal, styleUnitInstance.id, v);
        }, env.normalTypingDebounceMillis);
        //
        return [this.props.useVisualStyles
            ? null
            : <div>
                <select class="form-input form-select" defaultValue={ currentBlockStyleTemplates[0].id } ref={ this.instantiateTemplateDropdown }>{ currentBlockStyleTemplates.map(({id, title}) => <option value={ id }>{ __(title) }</option>) }</select>
                <button onClick={ () => this.addStyleInstanceUnit(currentBlockStyleTemplates.find(({id}) => id === this.instantiateTemplateDropdown.current.value)) } title={ __('Add style instance') }></button>
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
                                'throttledHandleValueChanged(newValAsString, valIsSet, varMeta, valHasUnit, bu, styleUnitInstance, v)';
                            else
                                'this.removeValueAndEmit({varName: varMeta.varName, value: v ? v.value : varMeta.defaultValue}, styleUnitInstance)';
                        } }
                        key={ `${bu.id}-${varMeta.varName}` }/>;
                }) }
                </div>
            </div>;
        }) : [<div class="color-dimmed px-2 pt-1">{ __('No editable styles.') }</div>])];
    }
    /**
     * @access private
     */
    unload() {
        this.setState({currentBlockStyleTemplates: null, styleUnitBundles: null, inited: false});
    }
    /**
     * @access private
     */
    addStyleInstanceUnit(styleTemplate) {
        // todo
    }
}

/**
 * @param {Array<UnitVarValue>} values
 * @param {Array<StyleUnitTemplate>} styleTmpl
 * @returns {String}
*/
function generateCssFromVals(values, styleTmpl) {
    const getVarMetaFor = (v, frm) => frm.find(vm => vm.varName === v.varName);
    return values.map(v => {
        const varMeta = getVarMetaFor(v, styleTmpl.varMetas);
        const css = varMeta.wrap; // todo compile to css
        return css.replace(/%s/g, v.value); // todo compile to css
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
 * todo
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
 * todo
 */
function varMetaToValue(varMeta) {
    return {varName: varMeta.varName, value: null};
}

/**
 * @param {Array<String>} clses
 * @returns {Array<String>}
 */
function onlyVarValUnitClasses(clses) {
    return clses.filter(cls => cls.startsWith(VAR_UNIT_CLS_PREFIX));
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
 * @typedef BlockStylesTabProps
 * @prop {Boolean} isVisible
 * @prop todo todo
 */

export default BlockStylesTab;
