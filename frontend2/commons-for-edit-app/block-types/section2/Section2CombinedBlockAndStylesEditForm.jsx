import {mediaScopes} from '../../../shared-inline.js';
import blockTreeUtils from '../../block/tree-utils.js';
import {writeBlockProps} from '../../block/utils.js';
import BlockVisualStylesEditForm, {
    createCssVarsMaps,
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {createJustifyContentVarDef} from '../../BlockVisualStylesEditFormFuncs.js';
import {__, api, scssWizard} from '../../edit-app-singletons.js';
import {Icon} from '../../Icon.jsx';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';
import ColumnEditTabForm from './ColumnEditTabForm.jsx';
import {
    colsScreenToTransferable,
    colsToLocalRepr,
    createColumnConfig,
    createStateForEachScreenSize,
    innerElScope,
    toStyleConfig,
} from './Section2CombinedBlockAndStylesEditFormFuncs.js';
/** @typedef {import('./Section2CombinedBlockAndStylesEditFormFuncs.js').ColumnConfig} ColumnConfig */
/** @typedef {import('./Section2CombinedBlockAndStylesEditFormFuncs.js').ColumnConfigLocalRepr} ColumnConfigLocalRepr */
/** @typedef {import('./Section2CombinedBlockAndStylesEditFormFuncs.js').section2ColConfigsAllScreens} section2ColConfigsAllScreens */
/** @typedef {import('../../../edit-app/menu-column/SaveButton.jsx").state} saveButtonEventState */

/** @type {Array<VisualStylesFormVarDefinition>} */
const cssVarDefs = [
    {
        varName: 'width',
        cssProp: 'width',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Inline'), value: 'fit-content'},
                {label: __('Full'), value: null},
            ],
            label: 'Width',
            inputId: 'section2Width',
        },
    },
    {
        varName: 'columnGap',
        cssProp: 'column-gap',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Gap ↔',
            inputId: 'section2ColumnGap',
            defaultThemeValue: '0.4rem'
        },
    },
    {
        varName: 'rowGap',
        cssProp: 'row-gap',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Gap ↕',
            inputId: 'section2RowGap',
            defaultThemeValue: '0.4rem'
        },
    },
    {
        varName: 'alignY',
        cssProp: 'align-items',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Start'), value: 'start'},
                {label: __('Center'), value: 'center'},
                {label: __('End'), value: 'end'},
                {label: __('Baseline'), value: 'baseline'},
                {label: __('Normal'), value: 'normal'},
                {label: __('Stretch'), value: 'stretch'},
                {label: '-', value: null},
            ],
            label: 'Align ⇅',
            inputId: 'section2AlignY',
        },
    },
    {
        varName: 'alignX',
        cssProp: 'margin-inline',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: __('Center'), value: 'auto'},
                {label: '-', value: null},
            ],
            label: 'Align ⇄',
            inputId: 'section2AlignX',
        },
    },
    {
        varName: 'minHeight',
        cssProp: 'min-height',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Min height',
            inputId: 'section2MinHeight',
        },
    },
    {
        varName: 'bgOuterColor',
        cssProp: 'background-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Outer background',
            inputId: 'section2BgOuterColor',
        },
    },
    {
        varName: 'bgOuterImage',
        cssProp: 'background-image',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'backgroundImage',
            label: 'Outer background',
            inputId: 'section2BgOuterImage',
        },
    },
    {
        varName: 'bgInnerColor',
        cssProp: 'background-color',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'color',
            label: 'Inner background',
            inputId: 'section2BgInnerColor',
        },
    },
    {
        varName: 'bgInnerImage',
        cssProp: 'background-image',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'backgroundImage',
            label: 'Inner background',
            inputId: 'section2BgInnerImage',
        },
    },
    ...createPaddingVarDefs('section2'),
];

class Section2CombinedBlockAndStylesEditForm extends BlockVisualStylesEditForm {
    /**
     * @inheritdoc
     */
    createCssVarDefinitions() {
        return cssVarDefs;
    }
    /**
     * @access protected
     */
    componentWillMount() {
        // Note: skip super.componentWillMount()
        const [state, styleRefs] = this.createStateAndStyleRefs(this.props);
        this.userStyleRefs = styleRefs;
        this.setState({...state, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps & BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        // Note: skip super.componentWillReceiveProps()
        if (props.stylesStateId !== this.props.stylesStateId) {
            const [newState, styleRefs] = this.createStateAndStyleRefs(props);
            this.userStyleRefs = styleRefs;
            this.setState(newState);
        }
    }
    /**
     * @access protected
     */
    render(_, {editStateIsOn, screenSizeColumns, styleScopes, curScreenSizeTabIdx}) {
        if (curScreenSizeTabIdx === 0) {
        const selectedScreenSizeVars = styleScopes[curScreenSizeTabIdx] || {};
        const columnConfigs = screenSizeColumns[curScreenSizeTabIdx] || colsToLocalRepr([createColumnConfig()]);
        const {mainEl, innerEls} = !editStateIsOn ? toStyleConfig(columnConfigs, '2.4rem') : {};
        return <ScreenSizesVerticalTabs
            populatedTabs={ this.userStyleRefs.map(s => !!s) }
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
            <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">
                <div class="grid-builder flex-centered mt-1 mr-1">{ !editStateIsOn
                    ? [
                        <div class="row" style={ mainEl.template.replace('%s', mainEl.val) }>
                            { columnConfigs.map((col, i) => {
                                const ss = innerEls[i];
                                const alignCss = ss.align?.val ? `justify-self: ${ss.align.val}` : '';
                                const visibilityCls = ss.visibility?.val === 'hidden' ? ' visibility-hidden' : '';
                                return <div class={ `col flex-centered${visibilityCls}` } style={ alignCss }>
                                    <button onClick={ () => this.openColumnForEdit(i) } class="btn btn-sm btn-link">
                                        { col.width || 'auto' } <Icon iconId="pencil" className="size-xxs color-dimmed3"/>
                                    </button>
                                    <button onClick={ () => this.deleteColumn(i, screenSizeColumns, curScreenSizeTabIdx) } class="btn btn-xs btn-link p-absolute" style="right: .2rem;top: .2rem;">
                                        <Icon iconId="x" className="size-xxs color-dimmed3"/>
                                    </button>
                                </div>;
                            }) }
                        </div>,
                        <button
                            onClick={ () => this.addColumn(screenSizeColumns, this.userStyleRefs[curScreenSizeTabIdx], curScreenSizeTabIdx) }
                            class="btn btn-sm flex-centered btn-link p-0"
                            title={ __('Add columnn') }>
                            <Icon iconId="plus" className="size-xxs color-dimmed3"/>
                        </button>
                    ]
                    : <ColumnEditTabForm
                        column={ columnConfigs[this.state.openColIdx] }
                        onPropChanged={ (propName, val) => this.handlePropOfOpenColConfigChanged(propName, val, screenSizeColumns, curScreenSizeTabIdx) }
                        onEditEnded={ this.endColumnEdit.bind(this) }/>
                }</div>
                { this.cssVarDefs.map(def =>
                    this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssCodeFn)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
        } else {
        const selectedScreenSizeVars = styleScopes[curScreenSizeTabIdx] || {};
        const currentScreenHasVars = !!screenSizeColumns[curScreenSizeTabIdx];
        const columnConfigs = screenSizeColumns[curScreenSizeTabIdx] || colsToLocalRepr([createColumnConfig()]);

        const inheritedColumnConfigs = createInheritedCols(curScreenSizeTabIdx, screenSizeColumns) || columnConfigs;
        const {mainEl, innerEls} = !editStateIsOn ? toStyleConfig(columnConfigs, '2.4rem') : {};
        const t = !editStateIsOn ? toStyleConfig(inheritedColumnConfigs, '2.4rem') : {};
        const [inheritedMainEl, inheritedInnerEls] = t ? [t.mainEl, t.innerEls] : [null, null];
        const mainToShow = currentScreenHasVars ? mainEl : inheritedMainEl;
        const innerElsToShow = currentScreenHasVars ? innerEls : inheritedInnerEls;
        const colsToShow = currentScreenHasVars ? columnConfigs : inheritedColumnConfigs;
        return <ScreenSizesVerticalTabs
            populatedTabs={ this.userStyleRefs.map(s => !!s) }
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
            <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">
                <div class="grid-builder flex-centered mt-1 mr-1">{ !editStateIsOn
                    ? [
                        <div class="row" style={ mainToShow.template.replace('%s', mainToShow.val) }>
                            { colsToShow.map((col, i) => {
                                const ss = innerElsToShow[i];
                                const alignCss = ss.align?.val ? `justify-self: ${ss.align.val}` : '';
                                const visibilityCls = ss.visibility?.val === 'hidden' ? ' visibility-hidden' : '';
                                return <div class={ `col flex-centered${visibilityCls}` } style={ alignCss }>
                                    <button onClick={ () => this.openColumnForEdit(i) } class="btn btn-sm btn-link">
                                        { col.width || 'auto' } <Icon iconId="pencil" className="size-xxs color-dimmed3"/>
                                    </button>
                                    <button onClick={ () => {
                                        if (currentScreenHasVars)
                                            this.deleteColumn(i, screenSizeColumns, curScreenSizeTabIdx);
                                        else {
                                            const newCols = inheritedColumnConfigs.slice(0, inheritedColumnConfigs.length - 1);
                                            this.createAndEmitNewStylesForSmallerScreen(curScreenSizeTabIdx, newCols, screenSizeColumns);
                                        }
                                    } } class="btn btn-xs btn-link p-absolute" style="right: .2rem;top: .2rem;">
                                        <Icon iconId="x" className="size-xxs color-dimmed3"/>
                                    </button>
                                </div>;
                            }) }
                        </div>,
                        <button
                            onClick={ () => {
                                if (currentScreenHasVars)
                                    this.addColumn(screenSizeColumns, this.userStyleRefs[curScreenSizeTabIdx], curScreenSizeTabIdx);
                                else {
                                    const newCols = [...inheritedColumnConfigs, createColumnConfig()];
                                    this.createAndEmitNewStylesForSmallerScreen(curScreenSizeTabIdx, newCols, screenSizeColumns);
                                }
                             } }
                            class="btn btn-sm flex-centered btn-link p-0"
                            title={ __('Add columnn') }>
                            <Icon iconId="plus" className="size-xxs color-dimmed3"/>
                        </button>
                    ]
                    : <ColumnEditTabForm
                        column={ colsToShow[this.state.openColIdx] }
                        onPropChanged={ (propName, val) => {
                            if (currentScreenHasVars)
                                this.handlePropOfOpenColConfigChanged(propName, val, screenSizeColumns, curScreenSizeTabIdx);
                            else {
                                const updatedCols = inheritedColumnConfigs.map((col, i) =>
                                    i !== this.state.openColIdx ? col : {...col, [propName]: val}
                                );
                                this.createAndEmitNewStylesForSmallerScreen(curScreenSizeTabIdx, updatedCols, screenSizeColumns,
                                    propName);
                            }
                        } }
                        onEditEnded={ this.endColumnEdit.bind(this) }/>
                }</div>
                { this.cssVarDefs.map(def =>
                    this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssCodeFn)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
        }
    }
    /**
     * @param {BlockStylesEditFormProps & BlockEditFormProps} props
     * @returns {[Object, Array<StyleChunk|null>]} [state, styleRefs]
     * @access private
     */
    createStateAndStyleRefs(props) {
        const [scopes, styleRefs] = createCssVarsMaps(props.blockId, this.cssVarDefs);
        const screenSizeColumns = createStateForEachScreenSize(props.block.columns);
        return [
            {
                styleScopes: scopes,
                screenSizeColumns,
            },
            styleRefs
        ];
    }
    /**
     * @param {section2ColConfigsAllScreens} colsScreensAll
     * @param {StyleChunk|null} curStyleChunkSelectedScreen
     * @param {Number} curScreenSizeTabIdx
     * @access private
     */
    addColumn(colsScreensAll, curStyleChunkSelectedScreen, curScreenSizeTabIdx) {
        if (curStyleChunkSelectedScreen) {
            const newColsScreensAll = colsScreensAll.map((colsSingleScreenLocalRepr, i) => i !== curScreenSizeTabIdx
                ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
                : [...colsScreenToTransferable(colsSingleScreenLocalRepr), createColumnConfig()]
            );
            this.emitNewCols(newColsScreensAll, curScreenSizeTabIdx);
        } else {
            const newColsScreensAll = colsScreensAll.map((colsSingleScreenLocalRepr, i) => i !== curScreenSizeTabIdx
                ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
                : [createColumnConfig(), createColumnConfig()]
            );
            this.emitNewCols(newColsScreensAll, curScreenSizeTabIdx, true);
        }
    }
    /**
     * @param {keyof ColumnConfig} propName
     * @param {String|Boolean|null} val
     * @param {section2ColConfigsAllScreens} colsScreensAll
     * @param {Number} curScreenSizeTabIdx
     */
    handlePropOfOpenColConfigChanged(propName, val, colsScreensAll, curScreenSizeTabIdx) {
        const newColsScreensAll = colsScreensAll.map((colsSingleScreenLocalRepr, i) => i !== curScreenSizeTabIdx
            ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
            : colsScreenToTransferable(colsSingleScreenLocalRepr).map((transferable, i2) =>
                i2 !== this.state.openColIdx ? transferable : {...transferable, [propName]: val}
            )
        );
        const updatedColsSelectedScreen = newColsScreensAll[curScreenSizeTabIdx];
        const saveButton = api.saveButton.getInstance();

        saveButton.pushOpGroup(
            this.createUpdateBlockColsUpdateOp(newColsScreensAll, saveButton),

            ['stylesBundle', (function (self) {
                if (propName === 'width') {
                    const {mainEl} = toStyleConfig(updatedColsSelectedScreen);
                    return scssWizard.addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(
                        [
                            `${innerElScope} {`,
                            `  ${mainEl.template}`,
                            '}'
                        ],
                        mainEl.val,
                        self.userStyleRefs[curScreenSizeTabIdx],
                        mediaScopes[curScreenSizeTabIdx]
                    );
                } else if (propName === 'align' || propName === 'isVisible') {
                    const {innerEls} = toStyleConfig(updatedColsSelectedScreen);
                    const v = innerEls[self.state.openColIdx][propName !== 'isVisible' ? propName : 'visibility'];
                    return v.val ? scssWizard.addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(
                        v.template,
                        v.val,
                        self.userStyleRefs[curScreenSizeTabIdx],
                        mediaScopes[curScreenSizeTabIdx]
                    ) : scssWizard.deleteScssCodeFromExistingUniqueScopeChunkAndReturnAllRecompiled(
                        v.template,
                        '"dummy"',
                        self.userStyleRefs[curScreenSizeTabIdx],
                        mediaScopes[curScreenSizeTabIdx]
                    );
                }
            })(this)]
        );
    }
    /**
     * @param {Number} colIdx
     * @access private
     */
    openColumnForEdit(colIdx) {
        this.setState({
            editStateIsOn: true,
            openColIdx: colIdx,
        });
    }
    /**
     * @access private
     */
    endColumnEdit() {
        this.setState({
            editStateIsOn: false,
            openColIdx: null,
        });
    }
    /**
     * @param {Number} smallerScreenIdx
     * @param {Array<ColumnConfig|ColumnConfigLocalRepr>} newColsCreatedFromLargerInheritedScreen
     * @param {section2ColConfigsAllScreens} colsScreensAll
     * @param {keyof ColumnConfig} firstSetProp = null
     * @access private
     */
    createAndEmitNewStylesForSmallerScreen(smallerScreenIdx, newColsCreatedFromLargerInheritedScreen, colsScreensAll, firstSetProp = null) {
        const newColsScreensAll = colsScreensAll.map((colsSingleScreenLocalRepr, i) => i !== smallerScreenIdx
            ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
            : colsScreenToTransferable(newColsCreatedFromLargerInheritedScreen)
        );
        this.emitNewCols(newColsScreensAll, smallerScreenIdx, true, firstSetProp);
    }
    /**
     * @param {Number} idx
     * @param {section2ColConfigsAllScreens} colsScreensAll
     * @param {Number} smallerScreenIdx
     * @access private
     */
    deleteColumn(idx, colsScreensAll, curScreenSizeTabIdx) {
        const newColsScreensAll = colsScreensAll.map((colsSingleScreenLocalRepr, i) => i !== curScreenSizeTabIdx
            ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
            : colsScreenToTransferable(colsSingleScreenLocalRepr).filter((_, i2) =>i2 !== idx)
        );
        this.emitNewCols(newColsScreensAll, curScreenSizeTabIdx);
    }
    /**
     * @param {section2ColConfigsAllScreens} newColsScreensAll
     * @param {Number} curScreenSizeTabIdx
     * @param {Boolean} isNewChunk = false
     * @param {keyof ColumnConfig} firstSetProp = null
     * @access private
     */
    emitNewCols(newColsScreensAll, curScreenSizeTabIdx, isNewChunk = false, firstSetProp = null) {
        const selectedScreenCols = newColsScreensAll[curScreenSizeTabIdx];
        const saveButton = api.saveButton.getInstance();

        saveButton.pushOpGroup(
            this.createUpdateBlockColsUpdateOp(newColsScreensAll, saveButton),

            ['stylesBundle', (function (self) {
                const {mainEl} = toStyleConfig(selectedScreenCols);
                const css = [
                    `${innerElScope} {`,
                    `  ${mainEl.template}`,
                    '}'
                ];
                if (!isNewChunk)
                    return scssWizard.addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(
                        css,
                        mainEl.val,
                        self.userStyleRefs[curScreenSizeTabIdx],
                        mediaScopes[curScreenSizeTabIdx]
                    );
                else {
                    // null means 'grid-template-columns'
                    if (!firstSetProp || firstSetProp === 'width')
                        return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                            css,
                            mainEl.val,
                            self.props.blockId,
                            mediaScopes[curScreenSizeTabIdx]
                        );
                    else if (firstSetProp === 'align' || firstSetProp === 'isVisible') {
                        const {innerEls} = toStyleConfig(selectedScreenCols);
                        const v = innerEls[self.state.openColIdx][firstSetProp !== 'isVisible' ? firstSetProp : 'visibility'];
                        return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                            v.template,
                            firstSetProp !== 'isVisible' ? v.val : v.val !== null ? v.val : 'visible',
                            self.props.blockId,
                            mediaScopes[curScreenSizeTabIdx]
                        );
                    }
                }
            })(this)]
        );
    }
    /**
     * @param {section2ColConfigsAllScreens} newColsScreensAll
     * @param {SaveButton} saveButton
     * @returns {[String, saveButtonEventState, StateChangeUserContext]}
     * @access private
     */
    createUpdateBlockColsUpdateOp(newColsScreensAll, saveButton) {
        return ['theBlockTree', blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
            const [blockRef] = blockTreeUtils.findBlockMultiTree(this.props.blockId, newTreeCopy);
            writeBlockProps(blockRef, {columns: newColsScreensAll});
            return newTreeCopy;
        }), {event: 'update-single-block-prop', blockId: this.props.blockId}];
    }
}

/**
 * @param {Number} forSmallerScreenIdx
 * @param {section2ColConfigsAllScreens} colsScreensAll
 * @returns {Array<ColumnConfigLocalRepr>|null}
 * @access private
 */
function createInheritedCols(forSmallerScreenIdx, colsScreensAll) {
    for (let i = forSmallerScreenIdx; i--; i > -1) {
        if (colsScreensAll[i])
            return colsScreensAll[i];
    }
    return null;
}

export default Section2CombinedBlockAndStylesEditForm;
