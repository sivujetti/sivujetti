import {__, api} from '@sivujetti-commons-for-edit-app';

let contentTabText;
let userStylesTabText;
let devStylesTabText;
let userCanEditCss;

function initLocals() {
    if (userCanEditCss === undefined) {
        contentTabText = __('Content');
        userStylesTabText = __('Styles (customizations)');
        devStylesTabText = __('Styles (definitions)');
        userCanEditCss = api.user.can('editBlockCss');
    }
}

/**
 * @param {Array<{kind: tabKind;}>} tabsConfig
 * @returns {Array<TabInfo>}
 */
function createTabsInfo(tabsConfig, filter = false) {
    initLocals();
    return (filter ? filterTabsForLoggedInUser(tabsConfig) : tabsConfig).map((itm) => {
        if (itm.kind === 'content')
            return {...itm, title: contentTabText};
        if (itm.kind === 'user-styles')
            return {...itm, title: userStylesTabText};
        if (itm.kind === 'dev-styles')
            return {...itm, title: devStylesTabText};
    });
}

/**
 * @param {Array<TabInfo>} allTabs
 * @returns {Array<TabInfo>}
 */
function filterTabsForLoggedInUser(allTabs) {
    initLocals();
    return userCanEditCss ? allTabs : allTabs.filter(({kind}) => kind.indexOf('dev-') < 0);
}

/**
 * @param {tabKind} savedTabKind
 * @param {Array<TabInfo>} tabsInfo
 * @returns {number}
 */
function createInitialTabKind(savedTabKind, tabsInfo) {
    initLocals();
    if (!tabsInfo.some(({kind}) => kind === savedTabKind)) {
        const similar = savedTabKind.indexOf('styles') > -1 ? 'styles' : 'content';
        return (tabsInfo.find(({kind}) => kind.indexOf(similar) > -1) || tabsInfo[0]).kind;
    }
    return savedTabKind;
}

/**
 * @typedef {'content'|'user-styles'|'dev-styles'|'dev-class-styles'} tabKind
 *
 * @typedef {{kind: tabKind; title: string;}} TabInfo
 */

export {
    createInitialTabKind,
    createTabsInfo,
    filterTabsForLoggedInUser,
};