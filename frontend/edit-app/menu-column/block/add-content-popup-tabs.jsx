import {
    __,
    api,
    blockTreeUtils,
    env,
    http,
    Icon,
    LoadingSpinner,
    objectUtils,
    urlUtils,
} from '@sivujetti-commons-for-edit-app';
import {createBlockFromBlueprint, createBlockFromType} from '../../includes/block/utils.js';
import {fetchOrGet as fetchOrGetReusableBranches} from '../../includes/reusable-branches/repository.js';
import VerticalTabs from '../../includes/VerticalTabs.jsx';
import {
    ccPlaceholder,
    createCustomClassChunkClassNameCreator,
    createIsDuplicateCustomClassChunkChecker,
} from '../block-styles/CustomClassStylesList.jsx';
import {createStyleShunkcScssIdReplacer} from './BlockTreeFuncs.js';

const blockBtnClses = 'btn with-icon with-icon-inline focus-default';

/** @extends {preact.Component<AddContentTabProps, any>} */
class AddReusableContentTab extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        http.get('/api/global-block-trees')
            .then(globalBlockTrees => {
                blockTreeUtils.setBackendGlobalBlockTrees(globalBlockTrees);
                const latest = api.saveButton.getInstance().getChannelState('globalBlockTrees');
                const uniqueMerged = [...latest, ...globalBlockTrees].reduce((out, gbt) => !out.some(({id}) => id === gbt.id) ? [...out, gbt] : out, []);
                this.setState({globalBlockTrees: uniqueMerged});
            })
            .catch(env.window.console.error);
        fetchOrGetReusableBranches()
            .then((reusables) => {
                this.setState({reusables});
            });
    }
    /**
     * @access protected
     */
    render({onContentPicked}, {reusables, globalBlockTrees}) {
        return <div class="block-buttons-list mt-1" data-list-of="reusables">
            { [
                ...(reusables || []).map(reusable => {
                    const root = reusable.blockBlueprints[0];
                    const blockType = api.blockTypes.get(root.blockType);
                    return <button
                        class={ blockBtnClses }
                        onClick={ () => onContentPicked(createReusableBlockSpawnDescriptor(root)) }
                        type="button">
                        <Icon iconId={ api.blockTypes.getIconId(root.blockType) } className="size-xs"/>
                        <span class="d-inline-block text-ellipsis">{ root.initialDefaultsData.title || __(blockType.friendlyName) }</span>
                    </button>;
                }),
                ...(globalBlockTrees || []).map(gbt =>
                    <button
                        class={ `globalBlockTree-block ${blockBtnClses}` }
                        onClick={ () => onContentPicked(createGbtBlockSpawnDescriptor(gbt)) }
                        type="button">
                        <Icon iconId={ api.blockTypes.getIconId(gbt.blocks[0].type) } className="size-xs"/>
                        <span class="d-inline-block text-ellipsis">{ gbt.name }</span>
                    </button>
                )
            ] }
        </div>;
    }
}

/**
 * @param {GlobalBlockTree} gbt
 * @returns {SpawnDescriptor}
 */
function createGbtBlockSpawnDescriptor(gbt) {
    return {
        block: createBlockFromType('GlobalBlockReference', undefined, {globalBlockTreeId: gbt.id}),
        isReusable: false,
        styles: null,
    };
}

/**
 * @param {Block} rootBlock
 * @returns {SpawnDescriptor}
 */
function createReusableBlockSpawnDescriptor(rootBlock) {
    const styles = [];
    const block = createBlockFromBlueprint(rootBlock, ({initialStyles}, block) => {
        const replacer = createStyleShunkcScssIdReplacer('@placeholder', block.id);
        styles.push(...initialStyles.map(replacer)); // 'data-block-id="@placeholder"' -> 'data-block-id="uagNk..."'
    });
    return {block, isReusable: true, styles};
}

////

const unspawnables = ['Heading', 'PageInfo', 'Paragraph', 'RichText', 'Section2'];
const common = ['Text', 'Image', 'Button', 'Section', 'Columns', 'JetIconsIcon', 'Wrapper'];
const other = ['Listing', 'Menu', 'Code'];

/** @extends {preact.Component<AddContentTabProps, any>} */
class AddSimpleContentBlocksTab extends preact.Component {
    // selectableBlockTypes;
    /**
     * @access protected
     */
    componentWillMount() {
        this.selectableBlockTypes = sort(Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            unspawnables.indexOf(name) < 0 && name !== 'GlobalBlockReference'
        ));
    }
    /**
     * @access protected
     */
    render({onContentPicked}) {
        return <VerticalTabs tabs={ [
            {text: __('Common#plural')},
            {text: __('Other')},
            {text: __('Plugins')},
        ] }>{ (_tab, curTabIdx) => {
            let toList = [];
            if (curTabIdx === 0)
                toList = this.selectableBlockTypes.filter(([name]) => common.indexOf(name) > -1);
            else if (curTabIdx === 1)
                toList = this.selectableBlockTypes.filter(([name]) => other.indexOf(name) > -1);
            else {
                const notThese = [...common, ...other];
                toList = this.selectableBlockTypes.filter(([name]) => notThese.indexOf(name) < 0);
            }
            return <div class="block-buttons-list p-1 pb-0">
                { toList.map(([blockTypeName, blockType]) =>
                    <button
                        class={ blockBtnClses }
                        onClick={ () => onContentPicked(createSimpleBlockSpawnDescriptor(blockTypeName)) }
                        type="button">
                        <Icon iconId={ api.blockTypes.getIconId(blockType) } className="size-xs"/>
                        <span class="d-inline-block text-ellipsis">{ __(blockType.friendlyName) }</span>
                    </button>
                ) }
            </div>;
        } }</VerticalTabs>;
    }
}

/**
 * @param {string} blockTypeName
 * @returns {SpawnDescriptor}
 */
function createSimpleBlockSpawnDescriptor(blockTypeName) {
    return {
        block: createBlockFromType(blockTypeName),
        isReusable: false,
        styles: null,
    };
}

const ordinals = [
    'Text',
    'Image',
    'Button',

    'Section',
    'Columns',
    'Listing',
    'Menu',
    'Wrapper',
    'Code',

    'GlobalBlockReference',
    'PageInfo',
].reduce((out, blockTypeName, i) =>
    ({...out, ...{[blockTypeName]: i + 1}})
, {});

/**
 * @param {Array<[blockTypeName, BlockTypeDefinition]>} selectableBlockTypes
 * @returns {Array<[blockTypeName, BlockTypeDefinition]>}
 */
function sort(selectableBlockTypes) {
    selectableBlockTypes.sort(([a], [b]) => {
        const oA = ordinals[a] || Infinity;
        const oB = ordinals[b] || Infinity;
        return oA === oB ? 0 : oA < oB ? -1 : 1;
    });
    return selectableBlockTypes;
}

////

/** @extends {preact.Component<AddTemplateContentTabProps, any>} */
class AddTemplateContentTab extends preact.Component {
    // tabIds;
    // tabTitles;
    /**
     * @access protected
     */
    componentWillMount() {
        const tabs = {
            'headers': __('Headers'),
            'content': __('Content#plural'),
            'footers': __('Footers'),
            'other': __('Other'),
        };
        this.tabIds = Object.keys(tabs);
        this.tabTitles = this.tabIds.map(key =>
            ({text: tabs[key]})
        );
        fetchContentTemplates()
            .then(templates => { this.setState({templates}); })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    render({onContentPicked}, {templates}) {
        return <VerticalTabs tabs={ this.tabTitles } initialTabIdx={ 1 }>{ (tab, currentTabIdx) => {
            if (!templates)
                return <LoadingSpinner className="ml-2 pl-1"/>;
            const selectedCat = this.tabIds[currentTabIdx];
            const toList = templates.filter(({category}) => category === selectedCat);
            return <div class="image-buttons-list p-1">{ toList.length ? toList.map(tmpl =>
                <button onClick={ () => {
                    let descr;
                    try {
                        descr = createContentTemplateSpawnDescriptor(tmpl, this.props);
                    } catch (e) {
                        env.window.console.error(e);
                        env.window.alert(__('Failed to create block from template'));
                        return;
                    }
                    onContentPicked(descr);
                } } class="btn no-color" type="button">
                    <figure><img src={ urlUtils.makeAssetUrl(tmpl.previewImgSrc) }/></figure>
                    <div class="text-ellipsis text-tinyish color-dimmed2 p-2">
                        { __(tmpl.title || tmpl.blockBlueprints[0].initialDefaultsData.title) }
                    </div>
                </button>
            ) : <span class="text-tinyish ml-1 mt-1">{ __('No templates in category "%s".', tab.text) }</span> }</div>;
        } }</VerticalTabs>;
    }
}

/**
 * @returns {Promise<ContentTemplate[]>}
 */
function fetchContentTemplates() {
    return http.get('/api/content-templates');
}

/**
 * @param {ContentTemplate} template
 * @param {AddContentTabProps} props
 * @returns {SpawnDescriptor}
 */
function createContentTemplateSpawnDescriptor(template, props) {
    if (template.blockBlueprints.length > 1)
        throw new Error('template.blockBlueprints.length > 1 not implemented yet');

    const root = template.blockBlueprints[0];
    const styles = [];
    let spawnClassName = null;
    let checkIsDuplicateChunk = null;
    let newBlock = createBlockFromBlueprint(root, ({initialStyles}, block) => {
        if (block.styleClasses.indexOf(ccPlaceholder) < 0) return;

        if (initialStyles.length !== 1)
            throw new Error('template.blockBlueprints[*].initialStyles.length > 1 not implemented yet');
        if (initialStyles[0].scope.kind !== 'custom-class')
            throw new Error('template.blockBlueprints[*].initialStyles[0].kind !== "custom-class" not implemented yet');

        if (!checkIsDuplicateChunk) checkIsDuplicateChunk = createIsDuplicateCustomClassChunkChecker();
        // Case #1: The template's blockBlueprints.initialStyles[0] has already been added earlier -> use
        // the className of that style
        const className = checkIsDuplicateChunk(initialStyles[0]);
        if (className) {
            block.styleClasses = block.styleClasses.replace(ccPlaceholder, className);
            return;
        }

        if (!spawnClassName) spawnClassName = createCustomClassChunkClassNameCreator();
        // Case #2: The template's blockBlueprints.initialStyles[0] has not been added -> add it and
        // generate a className for it
        const incremented = spawnClassName();
        block.styleClasses = block.styleClasses.replace(ccPlaceholder, incremented);
        const {scss, data} = initialStyles[0];
        styles.push({
            ...initialStyles[0],
            scss: scss.replace(/@customClass\[0\]/g, incremented),
            data: data?.customizationSettings ? objectUtils.cloneDeepWithChanges(data, copy => {
                copy.customizationSettings.varDefs.forEach(v => {
                    v.varName = v.varName.replace(ccPlaceholder, incremented);
                });
            })
            : null,
        });
    });

    const wrapInSectionBlock = newBlock.type !== 'Section' && props.getIsInsertAfterOrBeforeRootLevelBlock();
    if (wrapInSectionBlock)
        newBlock = {
            ...createBlockFromType('Section'),
            children: [newBlock],
        };

    return {block: newBlock, isReusable: false, styles};
}

/**
 * @typedef {{
 *   onContentPicked: (descr: SpawnDescriptor) => void;
 * }} AddContentTabProps
 *
 * @typedef {{
 *   onContentPicked: (todo: todo) => void;
 *   getIsInsertAfterOrBeforeRootLevelBlock: () => boolean;
 * }} AddTemplateContentTabProps
 */

export {
    AddReusableContentTab,
    AddSimpleContentBlocksTab,
    AddTemplateContentTab,
};
