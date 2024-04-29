import {__, api} from '@sivujetti-commons-for-edit-app';

let contentTabText;
let userStylesTabText;
let devStylesTabText;
let userCanEditCss;

function initLocals() {
    if (userCanEditCss === undefined) {
        contentTabText = __('Content');
        userStylesTabText = __('Styles');
        devStylesTabText = __('Styles (code)');
        userCanEditCss = api.user.can('editBlockCss');
    }
}

/**
 * @param {Array<{kind: tabKind;}>} tabsConfig
 * @returns {Array<TabInfo>}
 */
function createTabsInfo(tabsConfig) {
    initLocals();
    const filtered = userCanEditCss ? tabsConfig : tabsConfig.filter(({kind}) => kind !== 'dev-styles');
    return filtered.map((itm) => {
        if (itm.kind === 'content')
            return {...itm, ...{title: contentTabText}};
        if (itm.kind === 'user-styles')
            return {...itm, ...{title: userStylesTabText}};
        if (itm.kind === 'content+user-styles')
            return {...itm, ...{title: `${contentTabText} & ${userStylesTabText}`}};
        if (itm.kind === 'dev-styles')
            return {...itm, ...{title: devStylesTabText}};
    });
}
/**
 * @param {tabKind} savedTabKind
 * @param {Array<TabInfo>} tabsInfo
 * @returns {Number}
 */
function createInitialTabKind(savedTabKind, tabsInfo) {
    initLocals();
    if (savedTabKind === 'dev-styles' && !userCanEditCss) {
        const idx = getTabIdx(tabsInfo, savedTabKind);
        return tabsInfo[idx - 1].kind;
    }
    if (tabsInfo[0].kind === 'content+user-styles' && (
        savedTabKind === 'user-styles' ||
        savedTabKind === 'content'
    )) {
        return 'content+user-styles';
    }
    if (savedTabKind === 'content+user-styles' && tabsInfo[0].kind === 'content')
        return 'content';
    return savedTabKind;
}

/**
 * @param {Array<TabInfo>} tabsInfo
 * @param {tabKind} ofKind
 * @returns {Number}
 */
function getTabIdx(tabsInfo, ofKind) {
    return tabsInfo.findIndex(({kind}) => kind === ofKind);
}

/**
 * @typedef {'content'|'user-styles'|'dev-styles'|'content+user-styles'} tabKind
 *
 * @typedef TabInfo
 * @prop {tabKind} kind
 * @prop {String} title
 */

export {
    createInitialTabKind,
    createTabsInfo,
};