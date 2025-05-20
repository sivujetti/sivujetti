import {
    __,
    env,
    urlUtils,
    api,
    LoadingSpinner,
} from '@sivujetti-commons-for-edit-app';
import {createContentTemplateSpawnDescriptor, fetchContentTemplates} from '../menu-column/block/add-content-popup-tabs.jsx';
import {pushInserBlockOp} from '../menu-column/block/AddContentPopup.jsx';

/** @extends {preact.Component<ContentTemplatePickerProps, {pickables: Array<ContentTemplate>;}>} */
class ContentTemplatePicker extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.fetchContentTemplatesToState();
    }
    /**
     * @access protected
     */
    render(_, {pickables}) {
        return <div class="image-buttons-list p-1">{ pickables ? pickables.length ? pickables.map(itm =>
            <button onClick={ () => this.handleTemplatePicked(itm) } class="btn no-color" type="button">
                <figure><img src={ urlUtils.makeAssetUrl(itm.previewImgSrc) }/></figure>
                <div class="text-ellipsis text-tinyish color-dimmed2 p-2">
                    { __(itm.title || itm.blockBlueprints[0].initialDefaultsData.title) }
                </div>
            </button>
        ) : <span class="text-tinyish ml-1 mt-1">{ `__('No templates in category "%s".', tab.text)` }</span> : <LoadingSpinner/> }</div>;
    }
    /**
     * @access private
     */
    async fetchContentTemplatesToState() {
        const pickables = await this.fetchPickableContentTemplates();
        this.setState({pickables});
    }
    /**
     * @returns {Promise<ContentTemplate[]>}
     * @access private
     */
    async fetchPickableContentTemplates() {
        try {
            const all = await fetchContentTemplates();
            const only = this.props.listOnly === 'root-sections' ? 'root-section:' : 'row:';
            return all.filter(fetchContentTemplatesToState => fetchContentTemplatesToState.category.startsWith(only));
        } catch (err) {
            env.window.console.error(err);
        }
    }
    /**
     * @param {ContentTemplate} template
     * @access private
     */
    handleTemplatePicked(template) {
        const {insertPos, isReplace} = this.props;
        const descr = createContentTemplateSpawnDescriptor(template);
        descr.block.config.dataCreatedFrom = template.id;
        const targetTrid = 'main';
        const targetBlockId = this.props.blockId;
        pushInserBlockOp(descr, targetBlockId, targetTrid, insertPos, isReplace, false);
        api.mainPopper.close();
    }
}

/**
 * @typedef {{
 *   blockId: string;
 *   insertPos: dropPosition;
 *   isReplace: boolean;
 *   listOnly: 'root-sections'|'rows';
 * }} ContentTemplatePickerProps
 */

export default ContentTemplatePicker;
