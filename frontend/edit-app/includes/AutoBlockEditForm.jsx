import {
    __,
    arrayUtils,
    env,
    FormGroupInline,
    LoadingSpinner,
    objectUtils,
} from '@sivujetti-commons-for-edit-app';
import {fetchContentTemplates} from '../menu-column/block/add-content-popup-tabs.jsx';
import {isRowBlock} from './block/utils.js';

/** @extends {preact.Component<AutoBlockEditFormProps, AutoBlockEditFormState>} */
class AutoBlockEditForm extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        if (!isRootSectionOrRow(this.props.block)) // sanity
            throw new Error('');
        this.updateState(this.props);
    }
    /**
     * @param {AutoBlockEditFormProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        const tabChanged = props.propGroup !== this.props.propGroup;
        if (tabChanged ||
            props.stylesStateId !== this.props.stylesStateId ||
            props.block !== this.props.block) {
            this.updateState(props, () => tabChanged ? null : [...this.state.autoItems]);
        }
    }
    /**
     * @param {AutoBlockEditFormProps} _
     * @param {AutoBlockEditFormState} state
     * @access protected
     */
    render(_, {autoItems, classifierVals}) {
        return <div class="form-horizontal pt-0">
            { autoItems ? autoItems.length ? autoItems.map(itm => {
                const {cfgEntity} = itm;
                if (cfgEntity.typeName === 'classifier')
                    return <FormGroupInline>
                        <label class="form-label">{ __(cfgEntity.label) }</label>
                        <select value={ classifierVals[itm.id] } onChange={ e => {
                            // @ts-ignore
                            const {value} = e.target;
                            if (value)
                                this.props.emitValueChanged({...this.props.block.config, [itm.id]: value}, 'config');
                            else {
                                const copy = objectUtils.cloneDeep(this.props.block.config);
                                delete copy[itm.id];
                                this.props.emitValueChanged(copy, 'config');
                            }
                        } } class="form-input form-select" id="columnsAlignY">{
                            cfgEntity.choices.map(({val, label}) =>
                                <option value={ val }>{ __(label) }</option>
                            )
                        }</select>
                    </FormGroupInline>;
                if (cfgEntity.typeName === 'dynamic-css')
                    return 'todo';
            }) : <p>{ __('Täällä ei näytä olevan mitään') }</p> : <LoadingSpinner/> }
        </div>;
    }
    /**
     * @param {AutoBlockEditFormProps} props
     * @param {() => Array<ConfigTabItem>} getAutoItems = null
     * @access private
     */
    async updateState({block, propGroup}, getAutoItems = () => null) {
        const cur = block.config;
        const tabConfig = await this.getTabConfig(block);
        const state = {autoItems: getAutoItems() || tabConfig[propGroup], classifierVals: {}};
        state.autoItems.forEach(itm => {
            if (itm.cfgEntity.typeName === 'classifier') {
                state.classifierVals[itm.id] = Object.hasOwn(cur, itm.id) ? cur[itm.id] : itm.cfgEntity.defVal;
            }
        });
        this.setState(state);
    }
    /**
     * @param {Block} block
     * @returns {Promise<TabConfigMap>}
     * @access private
     */
    async getTabConfig(block) {
        const contentTemplateId = block.config?.dataCreatedFrom;
        if (contentTemplateId) {
            const tempaltes = await fetchRootSectionOrRowContentTemplates();
            const itm = arrayUtils.findById(tempaltes, contentTemplateId);
            if (itm)
                // @ts-ignore
                return itm.blockBlueprints[0].initialDefaultsData.tabConfig;
        }
        if (block.type === 'RootSection')
            return {contentTab: [{
                cssProp: 'background-color',
                varName: 'backgroundColor',
                cssSubSelector: null,
                widgetSettings: {'label': 'Background', 'valueType': 'color', 'defaultThemeValue': '#000000'}
            }].map(vd => ({
                id: vd.varName, cfgEntity: {typeName: 'dynamic-css', ...vd},
            })), visualStylesTab: []};
        if (block.type === 'Columns')
            return {
                contentTab: [
                    {id: 'alignY', cfgEntity: {
                        typeName: 'classifier',
                        label: 'Align ↕',
                        choices: [
                            {val: '', label: 'Default'},
                            {val: 'start', label: 'Top'},
                            {val: 'center', label: 'Center'},
                            {val: 'end', label: 'Bottom'},
                        ],
                        defVal: '',
                    }}
                ],
                visualStylesTab: [],
            };
    }
}

let todo = null;

/**
 * @returns {Promise<ContentTemplate[]>}
 */
async function fetchRootSectionOrRowContentTemplates() {
    if (todo) return todo;
    try {
        const templates = await fetchContentTemplates();
        todo = templates.filter(t => t.category.split(':').length > 1);
        return todo;
    } catch (err) {
        env.window.console.error(err);
    }
}

/**
 * @param {Block} block
 * @returns {boolean}
 */
function isRootSectionOrRow(block) {
    return block.type === 'RootSection' || isRowBlock(block);
}

/** @typedef {{
 *   propGroup: keyof TabConfigMap;
 *   stylesStateId: number;
 * } & BlockEditFormProps} AutoBlockEditFormProps */

/** @typedef {{
 *   autoItems: Array<ConfigTabItem>;
 *   classifierVals: {[prop: string]: any;};
 * }} AutoBlockEditFormState */

/** @typedef {{
 *   contentTab: Array<ConfigTabItem>;
 *   visualStylesTab: Array<ConfigTabItem>;
 * }} TabConfigMap */

/** @typedef {{
 *   id: string;cfgEntity: ClassifierCfgEntity|DynamicCssCfgEntity;
 * }} ConfigTabItem */

/** @typedef {{
 *   typeName: 'classifier';
 *   label: string;
 *   choices: Array<{val: string; label: string;}>;
 *   defVal: any;
 * }} ClassifierCfgEntity */

/** @typedef {{
 *   typeName: 'dynamic-css';
 * } & VisualStylesFormVarDefinition} DynamicCssCfgEntity */

export default AutoBlockEditForm;
export {isRootSectionOrRow};
