import {__, api, Icon, objectUtils, traverseRecursively} from '@sivujetti-commons-for-edit-app';
import {createBlockFromBlueprint, createBlockFromType} from '../../includes/block/utils.js';
import {fetchOrGet as fetchOrGetGlobalBlockTrees} from '../../includes/global-block-trees/repository.js';
import {fetchOrGet as fetchOrGetReusableBranches} from '../../includes/reusable-branches/repository.js';
import VerticalTabs from '../../includes/VerticalTabs.jsx';
import {createStyleShunkcScssIdReplacer} from './BlockTreeFuncs.js';

const blockBtnClses = 'btn with-icon with-icon-inline focus-default';

/** @extends {preact.Component<AddContentTabProps, any>} */
class AddReusableContentTab extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        fetchOrGetGlobalBlockTrees()
            .then(gbts => {
                const saveButton = api.saveButton.getInstance();
                const alreadyInCurrentPage = getGbtIdsFrom(saveButton.getChannelState('theBlockTree'));
                this.setState({selectableGlobalBlockTrees: gbts.filter(gbt =>
                    alreadyInCurrentPage.indexOf(gbt.id) < 0
                )});
            });
        fetchOrGetReusableBranches()
            .then((reusables) => {
                this.setState({reusables});
            });
    }
    /**
     * @access protected
     */
    render({onContentPicked}, {reusables, selectableGlobalBlockTrees}) {
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
                ...(selectableGlobalBlockTrees || []).map(gbt =>
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
        block: createBlockFromType('GlobalBlockReference', {__globalBlockTree: objectUtils.cloneDeep(gbt)}),
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

/*
 * @param {Array<Block>} currentBlockTree
 * @returns {Array<string>}
 */
function getGbtIdsFrom(currentBlockTree) {
    const ids = [];
    traverseRecursively(currentBlockTree, b => {
        if (b.type === 'GlobalBlockReference') ids.push(b.globalBlockTreeId);
    });
    ids.sort();
    return ids;
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

class AddTemplateContentTab extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <div class="image-buttons-list p-1">
            <VerticalTabs tabs={ [
                {text: __('Headers')},
                {text: __('Content#plural')},
                {text: __('Footers')},
            ] } initialTabIdx={ 1 }>{ (_tab, currentTabIdx) => {
                if (currentTabIdx === 0) { // 'Headers'
                    return 'list of header templates';
                } else if (currentTabIdx === 1) { // 'Content'
                    return 'list of content templates';
                } else if (currentTabIdx === 2) { // 'Footers'
                    return 'list of footer templates';
                }
            } }</VerticalTabs>
        </div>;
    }
}

/**
 * @typedef {{
 *   onContentPicked: (descr: SpawnDescriptor) => void;
 * }} AddContentTabProps
 */

export {
    AddReusableContentTab,
    AddSimpleContentBlocksTab,
    AddTemplateContentTab,
};
