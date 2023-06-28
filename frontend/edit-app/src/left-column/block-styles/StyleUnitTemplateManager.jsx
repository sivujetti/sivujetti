import {__, Icon} from '@sivujetti-commons-for-edit-app';
import store2 from '../../store2.js';
import {EditableTitle} from '../block/BlockStylesTab.jsx';

const LIST_UNITS_MODE = 'list-units';
const ADD_UNIT_MODE = 'add-unit';

class StyleTemplatesManager extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        if (this.props.isVisible) this.componentWillReceiveProps(this.props);
    }
    /**
     * @param {BlockStylesTabProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.isVisible && !this.state.inited) {
            this.setState({styleUnitTemplates: store2.get().styleUnitTemplates, inited: true, mode: LIST_UNITS_MODE});
        } else if (!props.isVisible && this.state.inited) {
            this.unload();
        }
    }
    /**
     * @access protected
     */
    render(_, {styleUnitTemplates, inited, mode}) {
        if (!inited) return null;
        //
        if (mode === ADD_UNIT_MODE)
            return <AddUnitForm
                blockTypeName={ this.props.blockTypeName }
                confirmAddTemplateUnit={ parsed => {
                    const {blockTypeName} = this.props;
                    store2.dispatch('styleUnitTemplates/addItem', [{
                        id: `j-${blockTypeName}-base-?`,
                        isFor: blockTypeName,
                        title: parsed.title,
                        isCommon: parsed.isCommon,
                        varMetas: [...parsed.varMetas],
                    }]);
                    this.setState({styleUnitTemplates: store2.get().styleUnitTemplates, mode: LIST_UNITS_MODE});
                } }/>;
        //
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
            onClick={ this.beginAddStyleTemplateMode.bind(this) }
            class="btn btn-primary btn-sm mr-1"
            type="button">{ __('Add style template') }</button>
        ];
    }
    /**
     * @access private
     */
    beginAddStyleTemplateMode() {
        this.setState({mode: ADD_UNIT_MODE});
    }
    /**
     * @access private
     */
    unload() {
        this.setState({styleUnitTemplates: null, inited: false});
    }
}

class AddUnitForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        const {blockTypeName} = this.props;
        this.setState({input: JSON.stringify({
            title: `${blockTypeName} something`,
            isCommon: false,
            varMetas: [{varName: 'padding', varType: 'length', args: [], wrap: 'padding: $padding;'}],
        }, null, 2)});
    }
    /**
     * @param {todo(styleReimpl)} props
     * @param {todo(styleReimpl)} state
     * @access protected
     */
    render({confirmAddTemplateUnit}, {input}) {
        return [
            <textarea
                onInput={ e => { this.setState({input: e.target.value}); } }
                class="form-input"
                rows="12">{ input }</textarea>,
            <button
                onClick={ () => {
                    const parsed = JSON.parse(input);
                    confirmAddTemplateUnit(parsed);
                } }
                type="button">Ok</button>
        ];
    }
}

export default StyleTemplatesManager;
