import BlockVisualStylesEditForm, {
    createCssVarsMaps,
    createPaddingVarDefs,
} from '../../BlockVisualStylesEditForm.jsx';
import {__, api, scssWizard} from '../../edit-app-singletons.js';
import {Icon} from '../../Icon.jsx';
import ScreenSizesVerticalTabs from '../../ScreenSizesVerticalTabs.jsx';
import {createCssDeclExtractor} from '../../ScssWizardFuncs.js';
import {mediaScopes} from '../../../shared-inline.js';
import ColumnEditTabForm from './ColumnEditTabForm.jsx';
import {
    columnsToScss,
    columnsToWidthCss,
    createColumnConfig,
    innerElScope,
} from './Section2CombinedBlockAndStylesEditFormFuncs.js';
/** @typedef {import('./Section2CombinedBlockAndStylesEditFormFuncs.js').ColumnConfig} ColumnConfig */

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
    /* {
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
    }, */
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
     * @inheritdoc
     */
    componentWillMount() {
        // Note: skip super.componentWillMount()
        const [state, styleChunks] = this.createCssVarsMaps(this.props);
        this.userStyleChunks = styleChunks;
        this.setState({...state, curScreenSizeTabIdx: 0});
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.stylesStateId !== this.props.stylesStateId) {
            const [state, styleChunks] = this.createCssVarsMaps(props);
            if (JSON.stringify(state.screens) !== JSON.stringify(this.state.styleScreens)) {
                this.userStyleChunks = styleChunks;
                this.setState(state);
            }
        }
    }
    /**
     * @access protected
     */
    render(_, {editStateIsOn, columnStyleScreens, styleScreens, curScreenSizeTabIdx}) {
        const selectedScreenSizeVars = styleScreens[curScreenSizeTabIdx] || {};
        const columns = columnStyleScreens[curScreenSizeTabIdx]?.columns || null;
        const chunks = this.userStyleChunks;
        return <ScreenSizesVerticalTabs
            populatedTabs={ chunks.map(s => !!s) }
            curTabIdx={ curScreenSizeTabIdx }
            setCurTabIdx={ to => this.setState({curScreenSizeTabIdx: to}) }>
            <div class="form-horizontal has-visual-style-widgets tight pt-1 pl-2">
                <div class="grid-builder flex-centered mt-1 mr-1">{ !editStateIsOn
                    ? [
                        <div class="row" style={ columns ? `grid-template-columns: ${columnsToWidthCss(columns, '2.4rem')}` : null }>
                            { curScreenSizeTabIdx > 0 && !columns
                                ? <span class="color-dimmed inherited-message">{ __('inherited') }</span>
                                : (columns || []).map((col, i) => {
                                    const alignCss = col.align ? `justify-self: ${col.align}` : '';
                                    const visibilityCls = col.visibility === 'hidden' ? ' visibility-hidden' : '';
                                    return <div class={ `col flex-centered${visibilityCls}` } style={ alignCss }>
                                        <button onClick={ () => this.openColumnForEdit(i) } class="btn btn-sm btn-link">
                                            { col.width || 'auto' } <Icon iconId="pencil" className="size-xxs color-dimmed3"/>
                                        </button>
                                        <button onClick={ () => this.deleteColumn(i, columns, curScreenSizeTabIdx) } class="btn btn-xs btn-link p-absolute" style="right: .2rem;top: .2rem;">
                                            <Icon iconId="x" className="size-xxs color-dimmed3"/>
                                        </button>
                                    </div>;
                                })
                            }
                        </div>,
                        <button
                            onClick={ () => this.addColumn(columns, curScreenSizeTabIdx) }
                            class="btn btn-sm flex-centered btn-link p-0"
                            title={ __('Add columnn') }>
                            <Icon iconId="plus" className="size-xxs color-dimmed3"/>
                        </button>
                    ]
                    : <ColumnEditTabForm
                        column={ columns[this.state.openColIdx] }
                        onPropChanged={ (propName, val) => this.handlePropOfOpenColConfigChanged(propName, val, this.state.openColIdx, columns, curScreenSizeTabIdx) }
                        onEditEnded={ this.endColumnEdit.bind(this) }/>
                }</div>
                { this.cssVarDefs.map(def =>
                    this.renderVarWidget(def, selectedScreenSizeVars, this.varInputToScssCodeFn)
                ) }
            </div>
        </ScreenSizesVerticalTabs>;
    }
    /**
     * @param {BlockStylesEditFormProps} props
     * @returns {[{styleScreens: Array<CssVarsMap>; columnStyleScreens: Array<{columns: Array<ColumnConfig>|null;}>;}, Array<StyleChunk|null>]}
     * @access private
     */
    createCssVarsMaps({blockId}) {
        const [styleScreens, styleChunks] = createCssVarsMaps(blockId, this.cssVarDefs);

        const columnStyleScreens = mediaScopes.map((_mediaScopeId, i) => {
            const chunk = styleChunks[i];
            if (!chunk) return {columns: null};

            const extr = createCssDeclExtractor(chunk.scss);
            // ['minmax(0, 140px', 'minmax(0, 1fr', 'minmax(0, 0px']
            const tmp = extr.extractVal('grid-template-columns', '>.j-Section2-cols')?.slice(0, -1).split(') ');
            // ['140px', '1fr', '0px']
            const widths = tmp ? tmp.map(p => p.split(', ')[1]) : [];
            // {'1': {width; align; visibility;}, '2': ...}
            const colsMap = widths.reduce((out, width, i2) => ({
                ...out,
                [`${i2 + 1}`]: {...createColumnConfig(), width},
            }), {});

            for (const node of extr.getAst()) {
                if (node.type !== 'rule') continue;

                const pcs = node.value.split(':nth-child('); // ['>.j-Section2-cols>', '3)']
                if (pcs.length > 1) {
                    const nthCol = pcs[1].slice(0, -1);
                    const {children} = node; // [{value: 'visibility:hidden;', ...}, ...]

                    if (!colsMap[nthCol]) colsMap[nthCol] = createColumnConfig();
                    colsMap[nthCol].align = children.find(n => n.type === 'decl' && n.value.startsWith('justify-self:'))?.children || null;
                    colsMap[nthCol].visibility = children.find(n => n.type === 'decl' && n.value.startsWith('visibility:'))?.children || null;
                }
            }

            const out = [];
            const nthColLargest = Math.max(...Object.keys(colsMap).map(s => parseInt(s, 10)));
            for (let i = 0; i < nthColLargest; ++i) {
                out.push(colsMap[`${i + 1}`] || createColumnConfig());
            }
            return {columns: out};
        }, []);

        return [
            {styleScreens, columnStyleScreens},
            styleChunks
        ];
    }
    /**
     * @param {Array<ColumnConfig>} to
     * @param {Number} curScreenSizeTabIdx
     * @access private
     */
    addColumn(to, curScreenSizeTabIdx) {
        const newColumns = [...(to || []), createColumnConfig()];
        const newScss = columnsToScss(newColumns);
        const updatedAll = to ? scssWizard.replaceUniqueScopeChunkAndReturnAllRecompiled(
            newScss,
            this.userStyleChunks[curScreenSizeTabIdx],
            mediaScopes[curScreenSizeTabIdx]
        ) : scssWizard.addNewUniqueScopeChunkAndReturnAllRecompiled(
            [
                newScss[0], // '>.j-Section2-cols {'
                '  grid-template-columns: %s;',
                '}'
            ],
            (() => {
                const pcs = newScss[1].split('grid-template-columns: '); // ['  ', 'minmax(0, 1fr);']
                return pcs[1].slice(0, -1);                              // 'minmax(0, 1fr)'
            })(),
            this.props.blockId,
            mediaScopes[curScreenSizeTabIdx]
        );
        emitNewStyles(updatedAll);
    }
    /**
     * @param {Number} colIdx
     * @param {Array<ColumnConfig>} from
     * @param {Number} curScreenSizeTabIdx
     * @access private
     */
    deleteColumn(colIdx, from, curScreenSizeTabIdx) {
        const newColumns = from.filter((_, i) => i !== colIdx);
        const updatedAll = newColumns.length ? scssWizard.replaceUniqueScopeChunkAndReturnAllRecompiled(
            columnsToScss(newColumns),
            this.userStyleChunks[curScreenSizeTabIdx],
            mediaScopes[curScreenSizeTabIdx]
        ) : scssWizard.deleteUniqueScopeChunkAndReturnAllRecompiled(
            this.userStyleChunks[curScreenSizeTabIdx],
            mediaScopes[curScreenSizeTabIdx]
        );
        emitNewStyles(updatedAll);
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
     * @param {String} propName
     * @param {String} val
     * @param {Number} colIdx
     * @param {Array<ColumnConfig>} columnsAll
     * @param {Number} curScreenSizeTabIdx
     * @access private
     */
    handlePropOfOpenColConfigChanged(propName, val, colIdx, columnsAll, curScreenSizeTabIdx) {
        const newColumns = columnsAll.map((c, i) => i !== colIdx ? c : {...c, [propName]: val});
        const updatedAll = scssWizard.replaceUniqueScopeChunkAndReturnAllRecompiled(
            columnsToScss(newColumns),
            this.userStyleChunks[curScreenSizeTabIdx],
            mediaScopes[curScreenSizeTabIdx]
        );
        emitNewStyles(updatedAll);
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
}

/**
 * @param {StylesBundleWithId} updatedAll
 */
function emitNewStyles(updatedAll) {
    api.saveButton.getInstance().pushOp(
        'stylesBundle',
        updatedAll
    );
}

export default Section2CombinedBlockAndStylesEditForm;
