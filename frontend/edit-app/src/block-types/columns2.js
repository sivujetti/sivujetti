import {__, api, http, FormGroupInline, Icon} from '@sivujetti-commons-for-edit-app';
import {cloneDeep} from '../block/utils-utils.js';
import blockTreeUtils from '../left-column/block/blockTreeUtils.js';

class Columns2BlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {getBlockCopy} = this.props;
        const block = getBlockCopy();
        this.setState({
            ...createColumnsState(block.columns),
            ...{
                editStateIsOn: false,
                editFormProps: null,
            }
        });
        api.saveButton.getInstance().subscribeToChannel('theBlockTree', (theTree, userCtx, _ctx) => {
            if (userCtx.event === 'update-single-block-prop' && userCtx.blockId === this.props.blockId) {
                const [block] = blockTreeUtils.findBlock(this.props.blockId, theTree);
                const newPartialStateCandidate = createColumnsState(block.columns);
                if (newPartialStateCandidate.columnsJson !== this.state.columnsJson) {
                    this.setState({...newPartialStateCandidate, ...(!this.state.editStateIsOn ? {} : {editFormProps: {...newPartialStateCandidate.columnstodo[this.state.colIdx]}})});
                }
            }
        });
    }
    /**
     * @access protected
     */
    render(_, {editStateIsOn, editFormProps, columnstodo}) {
        const [main, each] = !editStateIsOn ? decompose(columnstodo) : [null, null];
        return <div class="grid-builder flex-centered">
            { !editStateIsOn ? [<div class="row" style={ main }>
                { columnstodo.map((col, i) =>
                    <div class="col flex-centered" style={ each[i] || '' }>
                        <button onClick={ () => this.openColumnForEdit(i) } class="btn btn-sm btn-link">
                            { col.width || 'auto' } <Icon iconId="pencil" className="size-xxs color-dimmed3"/>
                        </button>
                        <button onClick={ () => this.deleteColumn(col) } class="btn btn-xs btn-link p-absolute" style="right: .2rem;top: .2rem;">
                            <Icon iconId="x" className="size-xxs color-dimmed3"/>
                        </button>
                    </div>
                ) }
            </div>, <button onClick={ this.addColumn.bind(this) } class="btn btn-sm flex-centered btn-link" title={ __('Add columnn') }>
                <Icon iconId="plus" className="size-xxs color-dimmed3"/>
            </button>] : <ColumnEditForm
                itm={ editFormProps }
                onUuu={ newItm => {
                    if (newItm) {
                        const aaaUpd = columnstodo.map(itm => itm.id !== editFormProps.id ? itm : ({...itm, ...newItm}));
                        const noIds = aaaUpd.map(ddsjnd => ({
                            width: ddsjnd.width,
                            align: ddsjnd.align,
                        }));
                        this.props.emitValueChanged(JSON.stringify(noIds), 'columns', false, 0, 'debounce-none');
                    }
                } }
                onEditEnded={ () => {
                    this.setState({editStateIsOn: false, editFormProps: null});
                } }/> }
        </div>;
    }
    /**
     * @access private
     */
    openColumnForEdit(colIdx) {
        this.setState({editStateIsOn: true, colIdx, editFormProps: {...this.state.columnstodo[colIdx]}});
    }
    /**
     * @access private
     */
    addColumn() {
        const noIds = [
            ...this.state.columnstodo.map(ddsjnd => ({ // todo stateColumnToColumn() ??
                width: ddsjnd.width,
                align: ddsjnd.align,
            })),
            {width: '1fr', align: null},
        ];
        this.emitColumnsChanges(noIds);
    }
    /**
     * @access private
     */
    deleteColumn(col) {
        const withIdsNew = this.state.columnstodo.filter(({id}) => id !== col.id);
        const noIds = withIdsNew.map(ddsjnd => ({ // todo stateColumnToColumn() ??
            width: ddsjnd.width,
            align: ddsjnd.align,
        }));
        this.emitColumnsChanges(noIds);
    }
    /**
     * @access private
     */
    emitColumnsChanges(newColumns) {
        const saveButton = api.saveButton.getInstance();

        saveButton.pushOpGroup(
            ['theBlockTree', createBlockTreeMutation(saveButton.getChannel('theBlockTree').getState(), theTree => {
                const [blockRef] = blockTreeUtils.findBlock(this.props.blockId, theTree);
                blockRef.columns = JSON.stringify(newColumns);
                return theTree;
            }), {event: 'update-single-block-prop', blockId: this.props.blockId}],

            ['css', (function (self) {
                const newScss = columnsToScss(newColumns);
                const css = window.stylis.serialize(window.stylis.compile(
                    `[block-id="${self.props.blockId}"] { ${newScss} }`,
                ), window.stylis.stringify);
                return css;
            })(this)]
        );
    }
}

function createBlockTreeMutation(theTree, mutator) {
    const newTree = cloneDeep(theTree);
    mutator(newTree);
    return newTree;
}

/**
 * @param {String} columnsJson
 * @returns {Array<?>}
 */
function aats(columnsJson) {
    const parsed = JSON.parse(columnsJson);
    return parsed.map((col, i) => ({
        ...col,
        ...{id: `c-${i}`} // ??
    }));
}

/*
[{width: null, align: 'end'}]
->
grid-template-columns: 1fr;
> :nth-child(1) {
    justify-self: end;
}

[{width: null, align: null}, {width: null, align: 'end'}]
->
grid-template-columns: 1fr 1fr;
> :nth-child(2) {
    justify-self: end;
}
*/
function decompose(cols) {
    const main = (
        'grid-template-columns: ' +
        cols.map(itm => `minmax(0, ${itm.width || '1fr'})`).join(' ') +
        ';'
    );
    const each = cols.map(itm =>
        itm.align ? [
            'justify-self: ', itm.align, ';'
        ].join('') : null
    ).filter(str => !!str);
    //
    return [main, each];
}

function columnsToScss(cols) {
    const [main, each1] = decompose(cols, 1);
    const each = each1.map((p, i) => [
        '> :nth-child(', i + 1,') {\n',
        '  ', p, '\n',
        '}',
    ].join('')).join('\n');
    //
    return main + (each.length ? `\n${each}` : '');
}

class ColumnEditForm extends preact.Component {
    // alignOptions;
    /**
     * @param {Aaa} props
     */
    constructor(props) {
        super(props);
        this.alignOptions = [
            {name: 'end', friendlyName: __('End')},
            {name: null, friendlyName: __('Default')},
        ];
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.rp(this.props);
    }
    /**
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.itm !== this.props.itm)
            this.rp(props)
    }
    rp(props) {
        this.setState({
            align: this.props.itm.align,
        });
    }
    /**
     * @access protected
     */
    render({onEditEnded}, {align}) {
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="todo" class="form-label">{ __('Align') }</label>
                <select value={ align } onChange={ this.handleAlignChanged.bind(this) } class="form-input form-select" id="todo">{
                    this.alignOptions.map(({name, friendlyName}) =>
                        <option value={ name }>{ friendlyName }</option>
                    )
                }</select>
            </FormGroupInline>
            <button onClick={ () => onEditEnded({align}) }>Ok</button>
            <button onClick={ () => onEditEnded(null) }>Cancel</button>
        </div>;
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleAlignChanged(e) {
        const newVal = e.target.value;
        this.props.onUuu({align: newVal});
    }
}

function createColumnsState(columnsJson) {
    return {columnsJson: columnsJson, columnstodo: aats(columnsJson)};
}

export default () => {
    const initialData = {
        columns: JSON.stringify([
            {width: '1fr', align: null},
            {width: '1fr', align: null}
        ])
    };
    const name = 'Columns2';
    return {
        name,
        friendlyName: 'Columns',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-generic-wrapper',
        icon: 'columns-3',
        reRender(block, renderChildren, shouldBackendRender) {
            if (shouldBackendRender)
                return http.post('/api/blocks/render', {block}).then(resp => resp.result);
            return ['<div class="j-', name, ' j-Columns',
                !block.styleClasses ? '' : ` ${block.styleClasses}`,
                '" data-block-type="', name, '" data-block="', block.id, '">',
                renderChildren(),
            '</div>'].join('');
        },
        createSnapshot: from => {
            return {columns: from.columns};
        },
        editForm: Columns2BlockEditForm,
    };
};
