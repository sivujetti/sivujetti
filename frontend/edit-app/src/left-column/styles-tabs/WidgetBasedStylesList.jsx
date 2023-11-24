import {__} from '@sivujetti-commons-for-edit-app';
import store2 from '../../store2.js';
import {createUnitClass, createUnitClassSpecial, findBlockTypeStyles, findBodyStyle,
        isBodyRemote} from './styles-tabs-common.js';
import EditableTitle from './EditableTitle.jsx';
import {createAddableUnits, createDataPropForValueInputRenderer, getEditableUnits,
        getEnabledUnits} from './widget-based-tab-funcs.js';
import ScreenSizesVerticalTabs from './ScreenSizesVerticalTabs.jsx';

class WidgetBasedStylesList extends preact.Component {
    // unregistrables;
    // editableTitleInstances;
    // curBlockStyleClasses;
    // bodyStyle;
    /**
     * @access protected
     */
    componentWillMount() {
        this.unregistrables = [];
        this.editableTitleInstances = [];
        const themeStyles = store2.get().themeStyles.styles;
        this.curBlockStyleClasses = this.props.blockCopy.styleClasses;
        const blockCopy = this.curBlockStyleClasses !== this.props.blockCopy.styleClasses
            ? {...this.props.blockCopy, ...{styleClasses: this.curBlockStyleClasses}}
            : this.props.blockCopy;
        const unitsOfThisBlockType = findBlockTypeStyles(themeStyles, blockCopy.type)?.units || [];
        this.bodyStyle = findBodyStyle(themeStyles);
        const unitsEnabled = getEnabledUnits(unitsOfThisBlockType, this.bodyStyle.units, blockCopy);
        //
        const state = this.createNewState(unitsOfThisBlockType, blockCopy, unitsEnabled);
        this.editableTitleInstances = state.unitsToShow.map(_ => preact.createRef());
        this.setState(state);
    }
    /**
     * @param {StylesListProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        //
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        this.unregistrables.forEach(unreg => unreg());
    }
    /**
     * @access protected
     */
    render({blockCopy, userCanEditVisualStyles}, {unitsToShow}) {
        const [curTabIdx, setCurTabIdx] = preactHooks.useState(0);
        return unitsToShow.length
            ? <ul class="list styles-list mb-2">{ unitsToShow.map((unit, i) => {
                const isDefault = isBodyRemote(unit.id);
                const cls = !isDefault ? createUnitClass(unit.id, blockCopy.type) : createUnitClassSpecial(unit.id, blockCopy.type);
                const key = unit.id;
                const cssVars = [];
                const valueEditors = [];
                const varsInsights = [];
                return <li key={ key } class="open">
                    <header class="flex-centered p-relative">
                        <b
                            onClick={ e => 'this.handleLiClick(e, i, isBodyRemote(unit.id))' }
                            class="col-12 btn btn-link text-ellipsis with-icon mt-0 mr-1 pt-0 pb-0 pl-1 no-color"
                            type="button">
                            <EditableTitle
                                unitId={ unit.id }
                                unitIdReal={ unit.id }
                                currentTitle={ unit.title }
                                blockTypeName={ blockCopy.type }
                                allowEditing={ userCanEditVisualStyles
                                    ? true               // admin user -> always
                                    : !!unit.derivedFrom // non-admin -> onyl if this unit is derived
                                }
                                subtitle={ isDefault ? [__('Default'), unit.specifier ? ` (${unit.specifier})` : ''].join('') : null }
                                subtitleMarginLeft={ 0.3 }
                                ref={ this.editableTitleInstances[i] }/>
                        </b>
                    </header>
                    <ScreenSizesVerticalTabs curTabIdx={ curTabIdx } setCurTabIdx={ setCurTabIdx }>
                        <div class="form-horizontal tight has-color-pickers pt-0 px-2">{ cssVars.length ? cssVars.map((cssVar, i2) => {
                            const Renderer = valueEditors.get(cssVar.type);
                            const ins = varsInsights[i2];
                            const valueIsClearable = ins && ins.hasChanged;
                            return <Renderer
                                varName={ cssVar.varName }
                                valueReal={ {...cssVar.value} }
                                argsCopy={ cssVar.args ? [...cssVar.args] : [] }
                                data={ createDataPropForValueInputRenderer(cssVar, unit, cls, [
                                    null,
                                    '@media (max-width: 960px) { ',
                                    '@media (max-width: 840px) { ',
                                    '@media (max-width: 600px) { ',
                                    '@media (max-width: 480px) { ',
                                ][curTabIdx]) }
                                isClearable={ valueIsClearable }
                                labelTranslated={ '__(varNameToLabel(withoutAppendix(cssVar.varName)))' }
                                onVarValueChanged={ newValAsString => {
                                    `const val = newValAsString !== null
                                        ? newValAsString
                                        : extractVal(varsInsights[i2].lineB);
                                    this.emitChange(val, cssVar, unit, ast, cls, parts, expanded, basepart)`;
                                } }
                                showNotice={ 'mutatedStyleInfo !== null && cssVar.varName === mutatedStyleInfo.firstMutatedVarName' }
                                noticeDismissedWith={ accepted => {
                                    `if (accepted) // Do create copy, replace block's cssClass '-unit-<old>' -> '-unit-<newCopy>'
                                        this.addUnitManyUnitClones(mutatedStyleInfo);
                                    dismissedCopyStyleNotices[this.props.blockCopy.__duplicatedFrom] = 'dismissed';
                                    this.setState({mutatedStyleInfo: null})`;
                                } }
                                key={ `${key}-${cssVar.varName}` }/>;
                        }) : <div class="pt-1">{ __('This style does not have editable values.') }</div> }</div>
                    </ScreenSizesVerticalTabs>
                </li>;
            }) }</ul>
            : <p class="pt-1 mb-2 color-dimmed">{ __('No own styles') }.</p>;
    }
    /**
     * @param {Array<ThemeStyleUnit>} unitsOfThisBlockType
     * @param {Array<RawBlock>} blockCopy
     * @param {Array<ThemeStyleUnit>|null} unitsEnabled = null
     * @access private
     */
    createNewState(unitsOfThisBlockType, blockCopy, unitsEnabled = null) {
        if (unitsEnabled === null)
            unitsEnabled = getEnabledUnits(unitsOfThisBlockType, this.bodyStyle.units, blockCopy);
        const userIsTechnical = !this.props.useVisualStyles;
        const [unitsToShow, addable] = unitsEnabled !== null
            ? [
                getEditableUnits(unitsEnabled, userIsTechnical),
                createAddableUnits(unitsOfThisBlockType, unitsEnabled, blockCopy.type, userIsTechnical)
            ] : [
                null,
                null
            ];
        return {
            unitsToShow,
            addable,
            unitsOfThisBlockType,
            unitsEnabled
        };
    }
}

export default WidgetBasedStylesList;
