import {
    __,
    env,
    floatingDialog,
    FormGroup,
    generatePushID,
    Icon,
    Tabs,
    timingUtils,
} from '@sivujetti-commons-for-edit-app';
import ScssEditor from '../../menu-column/block-styles/ScssEditor.jsx';
/** @typedef {import('../../includes/AutoBlockEditForm.jsx').TabConfigMap} TabConfigMap */

/** @extends {preact.Component<SaveBlockToLibraryPopupProps, SaveBlockToLibraryPopupState>} */
class SaveBlockToLibraryPopup extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.tabLabels = [__('Content'), __('Styles')];
        this.handleScssChangedThrottled = timingUtils.debounce(
            updatedScss => this.setState({css: updatedScss}),
            env.normalTypingDebounceMillis
        );
        this.setState({
            itemName: 'todo',
            tabConfig: {
                contentTab: [],
                visualStylesTab: [],
            },
            css: '.todo {\n  --todo: 1;\n}',
            curTabIdx: 0,
        });
    }
    /**
     * @param {SaveBlockToLibraryPopupProps} _
     * @param {SaveBlockToLibraryPopupState} state
     * @access protected
     */
    render(_, {itemName, tabConfig, curTabIdx}) {
        return <div>
            <div class="text-prose mb-1">{ __('todo') }</div>
            <FormGroup>
                <label htmlFor="libraryItemName" class="form-label">{ __('Name') }</label>
                <input name="name" type="text" value={ itemName } class="form-input" id="libraryItemName" placeholder={ __('todo') } disabled/>
            </FormGroup>
            <FormGroup>
                <label class="form-label">
                    { __('Tabs') }
                    <span class="tooltip tooltip-right tooltip-auto-width p-absolute ml-1" data-tooltip={ __('todo') }>
                        <Icon iconId="info-circle" className="color-dimmed3 size-xs"/>
                    </span>
                </label>
                <div>
                    <Tabs
                        links={ this.tabLabels }
                        onTabChanged={ (toIdx) => this.setState({curTabIdx: toIdx}) }
                        className="text-tinyish mt-0 mb-1"/>
                    { curTabIdx === 0
                        ? <textarea value={ JSON.stringify(tabConfig.contentTab, null, 2) } onChange={ e => this.idf(e, 'contentTab') } key="1"></textarea>
                        : <textarea value={ JSON.stringify(tabConfig.visualStylesTab, null, 2) } onChange={ e => this.idf(e, 'visualStylesTab') } key="2"></textarea>
                    }
                </div>
            </FormGroup>
            <FormGroup>
                <label class="form-label">CSS</label>
                <ScssEditor
                    editorId="v2ContentTemplateCss"
                    onInput={ scss => {
                        this.handleScssChangedThrottled(scss);
                    } }
                    scss={ this.state.css }/>
            </FormGroup>
            <div class="mt-8">
                <button
                    onClick={ this.doHandleSubmit.bind(this) }
                    class="btn btn-primary mr-2"
                    type="button">{ __('Save changes') }</button>
                <button
                    onClick={ () => floatingDialog.close() }
                    class="btn btn-link"
                    type="button">{ __('Cancel') }</button>
            </div>
        </div>;
    }
    idf(e, tb) {
        if (tb === 'contentTab')
            this.setState({tabConfig: {...this.state.tabConfig, contentTab: JSON.parse(e.target.value)}});
        else
            this.setState({tabConfig: {...this.state.tabConfig, visualStylesTab: JSON.parse(e.target.value)}});
    }
    async doHandleSubmit(e) {
        console.log('todo', {
            css: this.state.css,
            tabConfig: this.state.tabConfig,
            id: generatePushID(),
            blockBlueprints: [],
            title: this.state.itemName,
            previewImgSrc: 'todo',
            category: 'todo',
        });
    }
}

/**
 * @param {string} blockId
 */
function openAsDialog(blockId) {
    floatingDialog.open(SaveBlockToLibraryPopup, {
        title: __('Save to library'),
        height: 'auto',
    }, {
        blockId,
    });
}

/**
 * @typedef {{blockId: string;}} SaveBlockToLibraryPopupProps
 */

/**
 * @typedef {{itemName: string; tabConfig: TabConfigMap; curTabIdx: number; css: string;}} SaveBlockToLibraryPopupState
 */

export default SaveBlockToLibraryPopup;
export {openAsDialog};
