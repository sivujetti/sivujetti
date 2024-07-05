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
    return filterTabsForLoggedInUser(tabsConfig).map((itm) => {
        if (itm.kind === 'content')
            return {...itm, title: contentTabText};
        if (itm.kind === 'user-styles')
            return {...itm, title: userStylesTabText};
        if (itm.kind === 'content+user-styles')
            return {...itm, title: `${contentTabText} & ${userStylesTabText}`};
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
 * @returns {Number}
 */
function createInitialTabKind(savedTabKind, tabsInfo) {
    initLocals();
    if (savedTabKind.indexOf('dev-') > -1 && !userCanEditCss) {
        return tabsInfo.at(-1);
    }
    if (tabsInfo[0].kind === 'content+user-styles' && (
        savedTabKind === 'user-styles' ||
        savedTabKind === 'content'
    )) {
        return 'content+user-styles';
    }
    if ((savedTabKind === 'content+user-styles' && tabsInfo[0].kind === 'content') ||
        (tabsInfo.length === 1 && tabsInfo[0].kind === 'content'))
        return 'content';
    return savedTabKind;
}

/**
 * @typedef {'content'|'user-styles'|'dev-styles'|'dev-class-styles'|'content+user-styles'} tabKind
 *
 * @typedef {{kind: tabKind; title: string;}} TabInfo
 */

export {
    createInitialTabKind,
    createTabsInfo,
    filterTabsForLoggedInUser,
};