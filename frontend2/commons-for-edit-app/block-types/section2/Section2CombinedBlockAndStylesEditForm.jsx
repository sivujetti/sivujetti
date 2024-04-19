import {urlUtils} from '@sivujetti-commons-for-web-pages';
import {mediaScopes} from '../../../shared-inline.js';
import blockTreeUtils from '../../block/tree-utils.js';
import {writeBlockProps} from '../../block/utils.js';
import LengthValueInput from '../../styles/LengthValueInput.jsx';
import BlockVisualStylesEditForm, {
    createCssVarsMaps,
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__, api, scssWizard} from '../../edit-app-singletons.js';
import ColorPickerInput from '../../ColorPickerInput.jsx';
import {FormGroupInline} from '../../Form.jsx';
import {Icon} from '../../Icon.jsx';
import ImagePicker from '../../ImagePicker.jsx';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';
import {createCssDeclExtractor} from '../../ScssWizardFuncs.js';
import ColumnEditTabForm from './ColumnEditTabForm.jsx';
import {
    colsScreenToTransferable,
    createColumnConfig,
    createStateForEachScreenSize,
    innerElScope,
    toStyleConfig,
} from './Section2CombinedBlockAndStylesEditFormFuncs.js';

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
                {label: __('Full'), value: ''},
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
            label: 'Column gap',
            inputId: 'section2ColumnGap',
            defaultThemeValue: LengthValueInput.valueFromInput('0.4rem'),
        },
    },
    {
        varName: 'rowGap',
        cssProp: 'row-gap',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'length',
            label: 'Row gap',
            inputId: 'section2RowGap',
            defaultThemeValue: LengthValueInput.valueFromInput('0.4rem'),
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
                {label: '-', value: ''},
            ],
            label: 'Align x',
            inputId: 'section2AlignX',
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
                {label: '-', value: ''},
            ],
            label: 'Align y',
            inputId: 'section2AlignY',
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
            label: 'Outer background color',
            inputId: 'section2BgOuterColor',
        },
    },
    {
        varName: 'bgInnererColor',
        cssProp: 'background-color',
        cssSubSelector: innerElScope,
        widgetSettings: {
            valueType: 'color',
            label: 'Inner background color',
            inputId: 'section2BgInnerColor',
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
        const [state, styleRefs] = this.createStateAndStyleRefs(this.props);
        this.userStyleRefs = styleRefs;
        this.setState(state);
    }
    /**
     * @param {BlockStylesEditFormProps & BlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
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
        const selectedScreenSizeVars = styleScopes[curScreenSizeTabIdx] || {};
        const columnConfigs = screenSizeColumns[curScreenSizeTabIdx] || [createColumnConfig()];
        const {mainEl, innerEls} = !editStateIsOn ? toStyleConfig(columnConfigs, '2.4rem') : {};
        return <ScreenSizesVerticalTabs
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
                                    <button onClick={ () => this.deleteColumn(col) } class="btn btn-xs btn-link p-absolute" style="right: .2rem;top: .2rem;">
                                        <Icon iconId="x" className="size-xxs color-dimmed3"/>
                                    </button>
                                </div>;
                            }) }
                        </div>,
                        <button
                            onClick={ () => this.addColumn(screenSizeColumns, this.userStyleRefs[curScreenSizeTabIdx], curScreenSizeTabIdx) }
                            class="btn btn-sm flex-centered btn-link"
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
                    this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssChunkFn)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
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
                curScreenSizeTabIdx: 0,
                screenSizeColumns,
            },
            styleRefs
        ];
    }
    /**
     * @param {section2ColConfigsAllScreens} colsAllScreens
     * @param {StyleChunk|null} curStyleChunkSelectedScreen
     * @param {Number} curScreenSizeTabIdx
     * @access private
     */
    addColumn(colsAllScreens, curStyleChunkSelectedScreen, curScreenSizeTabIdx) {
        if (curStyleChunkSelectedScreen) {
            const newColScreens = colsAllScreens.map((colsSingleScreenLocalRepr, i) => i !== curScreenSizeTabIdx
                ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
                : [...colsScreenToTransferable(colsSingleScreenLocalRepr), createColumnConfig()]
            );
            const newCols = newColScreens[curScreenSizeTabIdx];
            const saveButton = api.saveButton.getInstance();

            saveButton.pushOpGroup(
                ['theBlockTree', blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                    const [blockRef] = blockTreeUtils.findBlockMultiTree(this.props.blockId, newTreeCopy);
                    writeBlockProps(blockRef, {columns: newColScreens});
                    return newTreeCopy;
                }), {event: 'update-single-block-prop', blockId: this.props.blockId}],

                ['stylesBundle', (function (self) {
                    const {mainEl} = toStyleConfig(newCols);
                    return scssWizard.addOrUpdateScssCodeToExistingUniqueScopeChunkAndReturnAllRecompiled(
                        [
                            `${innerElScope} {`,
                            `  ${mainEl.template}`,
                            '}'
                        ],
                        mainEl.val,
                        curStyleChunkSelectedScreen,
                        mediaScopes[curScreenSizeTabIdx]
                    );
                })(this)]
            );
        } else {
            const newCols = [createColumnConfig(), createColumnConfig()];
            const newColScreens = colsAllScreens.map((colsSingleScreenLocalRepr, i) => i !== curScreenSizeTabIdx
                ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
                : newCols
            );
            const saveButton = api.saveButton.getInstance();

            saveButton.pushOpGroup(
                ['theBlockTree', blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                    const [blockRef] = blockTreeUtils.findBlockMultiTree(this.props.blockId, newTreeCopy);
                    writeBlockProps(blockRef, {columns: newColScreens});
                    return newTreeCopy;
                }), {event: 'update-single-block-prop', blockId: this.props.blockId}],

                ['stylesBundle', (function (self) {
                    const {mainEl} = toStyleConfig(newCols);
                    return scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
                        [
                            `${innerElScope} {`,
                            `  ${mainEl.template}`,
                            '}'
                        ],
                        mainEl.val,
                        self.props.blockId,
                        mediaScopes[curScreenSizeTabIdx]
                    );
                })(this)]
            );
        }
    /**
     * @param {keyof Section2BlockColumnConfig} propName
     * @param {String|Boolean|null} val
     * @param {section2ColConfigsAllScreens} screenSizeColumns
     * @param {Number} curScreenSizeTabIdx
     */
    handlePropOfOpenColConfigChanged(propName, val, screenSizeColumns, curScreenSizeTabIdx) {
        const newColScreens = screenSizeColumns.map((colsSingleScreenLocalRepr, i) => i !== curScreenSizeTabIdx
            ? colsSingleScreenLocalRepr ? colsScreenToTransferable(colsSingleScreenLocalRepr) : null
            : colsScreenToTransferable(colsSingleScreenLocalRepr).map((transferable, i2) =>
                i2 !== this.state.openColIdx ? transferable : {...transferable, [propName]: val}
            )
        );
        const updatedColsSelectedScreen = newColScreens[curScreenSizeTabIdx];
        const saveButton = api.saveButton.getInstance();

        saveButton.pushOpGroup(
            ['theBlockTree', blockTreeUtils.createMutation(saveButton.getChannelState('theBlockTree'), newTreeCopy => {
                const [blockRef] = blockTreeUtils.findBlockMultiTree(this.props.blockId, newTreeCopy);
                writeBlockProps(blockRef, {columns: newColScreens});
                return newTreeCopy;
            }), {event: 'update-single-block-prop', blockId: this.props.blockId}],

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
                    const changedCol = updatedColsSelectedScreen[self.state.openColIdx];
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
     * @param {Section2BlockColumnConfigLocalRepr} col
     * @access private
     */
    deleteColumn(col) {
        // todo
    }
}

export default Section2CombinedBlockAndStylesEditForm;
