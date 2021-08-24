import {http, __} from '@sivujetti-commons';
import Icon from '../../../commons/Icon.jsx';

let counter = 0;

class MenuBlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({parsedTree: JSON.parse(this.props.block.tree)});
    }
    /**
     * @param {BlockEditFormProps} _
     * @access protected
     */
    render(_, {parsedTree}) {
        return <>
            <table class="table"><tbody>{ parsedTree.map(item => <tr key={ item.id }>
                <td>{ item.text }</td>
            </tr>) }</tbody></table>
            <button onClick={ this.appendItemToMenu.bind(this) }
                class="btn btn-sm text-tiny with-icon-inline color-dimmed mt-1" type="button">
                <Icon iconId="plus" className="size-xs mr-1"/> { __('Add item') }
            </button>
        </>;
    }
    /**
     * @access private
     */
    appendItemToMenu() {
        const newParsed = this.state.parsedTree.concat(
            makeLinkItem({slug: '/', text: __('Link text')})
        );
        this.setState({parsedTree: newParsed});
        const block = this.props.block;
        this.props.onValueChanged({
            tree: JSON.stringify(newParsed),
            wrapStart: block.wrapStart,
            wrapEnd: block.wrapEnd,
            treeStart: block.treeStart,
            treeEnd: block.treeEnd,
            itemAttrs: JSON.stringify(block.itemAttrs),
            itemEnd: block.itemEnd,
        });
    }
}

function makeLinkItem(vals) {
    const out = Object.assign({}, vals);
    if (!Object.prototype.hasOwnProperty.call(out, 'id'))
        out.id = ++counter;
    if (!Object.prototype.hasOwnProperty.call(out, 'children'))
        out.children = [];
    return out;
}

export default () => {
    const initialData = {
        tree: JSON.stringify([makeLinkItem({slug: '/', text: __('Home')}),
                              makeLinkItem({slug: '/about', text: __('About')})]),
        wrapStart: '',   // "<nav class=\"menu\">"
        wrapEnd: '',     // "</nav>"
        treeStart: '',   // "<ul>"
        treeEnd: '',     // "</ul>"
        itemAttrs: '[]', // "[]"
        itemEnd: '',     // "</li>"
    };
    return {
        name: 'Menu',
        friendlyName: 'Menu',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-menu',
        reRender(block) {
            return http.post('/api/blocks/render', {block}).then(resp => resp.result);
        },
        editForm: MenuBlockEditForm,
    };
};
