import {isRemote} from './block-styles/commons.js';
import theBlockTreeStore from './block/theBlockTreeStore.js';

const {createStoreon} = window.storeon;

function themeStylesStore(store) {
    store.on('themeStyles/setAll',
    /**
     * @param {Object} state
     * @param {[Array<ThemeStyle>]} args
     * @returns {Object}
     */
    (_state, [themeStyles]) =>
        ({themeStyles})
    );

    store.on('themeStyles/addStyle',
    /**
     * @param {Object} state
     * @param {[ThemeStyle]} args
     * @returns {Object}
     */
    ({themeStyles}, [style]) =>
        ({themeStyles: [...themeStyles, style]})
    );

    store.on('themeStyles/removeStyle',
    /**
     * @param {Object} state
     * @param {[String]} args
     * @returns {Object}
     */
    ({themeStyles}, [blockTypeName]) =>
        ({themeStyles: themeStyles.filter(s => s.blockTypeName !== blockTypeName)})
    );

    store.on('themeStyles/addUnitTo',
    /**
     * @param {Object} state
     * @param {[String, ThemeStyleUnit]} args
     * @returns {Object}
     */
    ({themeStyles}, [blockTypeName, unit]) => {
        const toAddIdx = findStyleIndex(themeStyles, blockTypeName);
        return {themeStyles: themeStyles.map((s, i) =>
            i !== toAddIdx ? s : Object.assign({}, s, {units: [...s.units, unit]})
        )};
    });

    store.on('themeStyles/removeUnitFrom',
    /**
     * @param {Object} state
     * @param {[String, ThemeStyleUnit]} args
     * @returns {Object}
     */
    ({themeStyles}, [blockTypeName, unit]) => {
        const toRemIdx = findStyleIndex(themeStyles, blockTypeName);
        const out = {themeStyles: withUnitRemoved(themeStyles, toRemIdx, unit.id)};
        if (isRemote(unit)) {
            const toRemIdx2 = findStyleIndex(themeStyles, unit.origin); // 'Button', 'Section' etc.
            const pcs = unit.id.split('-'); // ['j', 'Section', 'unit', '1']
            const unitId2 = pcs.slice(2).join('-'); // 'unit-1'
            out.themeStyles = withUnitRemoved(out.themeStyles, toRemIdx2, unitId2);
        }
        return out;
    });
    /**
     * @param {Array<ThemeStyle>} from
     * @param {Number} styleIdx
     * @param {String} unitId
     * @returns {Array<ThemeStyle>}
     */
    function withUnitRemoved(from, styleIdx, unitId) {
        return from.map((s, i) =>
            i !== styleIdx ? s : Object.assign({}, s, {units: s.units.filter(({id}) => id !== unitId)})
        );
    }

    store.on('themeStyles/updateUnitOf',
    /**
     * @param {Object} state
     * @param {[String, String, {[key: String]: any;}]} args
     * @returns {Object}
     */
    ({themeStyles}, [blockTypeName, unitId, newUnitData]) => {
        const toUpdIdx = findStyleIndex(themeStyles, blockTypeName);
        return {themeStyles: themeStyles.map((s, i) =>
            i !== toUpdIdx ? s : Object.assign({}, s, {units: s.units.map(u => u.id !== unitId ? u : Object.assign({}, u, newUnitData))})
        )};
    });
}

/**
 * @param {Array<ThemeStyle>} from
 * @param {String} blockTypeName
 * @returns {Number}
 */
function findStyleIndex(from, blockTypeName) {
    return from.findIndex(s => s.blockTypeName === blockTypeName);
}


////////////////////////////////////////////////////////////////////////////////


function reusableBranchesStore(store) {
    store.on('@init', () =>
        ({reusableBranches: []})
    );

    store.on('reusableBranches/setAll',
    /**
     * @param {Object} state
     * @param {[Array<ReusableBranch>]} args
     * @returns {Object}
     */
    (_state, [reusableBranches]) =>
        ({reusableBranches})
    );

    store.on('reusableBranches/addItem',
    /**
     * @param {Object} state
     * @param {[ReusableBranch]} args
     * @returns {Object}
     */
    ({reusableBranches}, [reusableBranch]) =>
        ({reusableBranches: [reusableBranch, ...reusableBranches]})
    );

    store.on('reusableBranches/removeItem',
    /**
     * @param {Object} state
     * @param {[String]} args
     * @returns {Object}
     */
    ({reusableBranches}, [id]) =>
        ({reusableBranches: reusableBranches.filter(b => b.id !== id)})
    );
}


////////////////////////////////////////////////////////////////////////////////


function pagesListingsStore(store) {
    store.on('pagesListings/setAll',
    /**
     * @param {Object} state
     * @param {[Array<RelPage>]} args
     * @returns {Object}
     */
    (_state, [pagesListings]) =>
        ({pagesListings})
    );

    store.on('pagesListings/addItem',
    /**
     * @param {Object} state
     * @param {[RelPage]} args
     * @returns {Object}
     */
    ({pagesListings}, [newItem]) =>
        ({pagesListings: [...pagesListings, newItem]})
    );
}


////////////////////////////////////////////////////////////////////////////////


function theWebsiteBasicInfoStore(store) {
    store.on('theWebsiteBasicInfo/set',
    /**
     * @param {Object} state
     * @param {[TheWebsiteBasicInfo]} args
     * @returns {Object}
     */
    (_state, [theWebsiteBasicInfo]) =>
        ({theWebsiteBasicInfo})
    );
}


////////////////////////////////////////////////////////////////////////////////


function styleUnitMetasStore(store) {
    store.on('styleUnitMetas/init',
    /**
     * @param {Object} state
     * @param {[Array<StyleUnitMeta>]} args
     * @returns {{styleUnitMetas: Array<StyleUnitMeta>; [otherStateBuckets: String]: any;}}
     */
    (_state, [styleUnitMetas]) =>
        ({styleUnitMetas})
    );
}


////////////////////////////////////////////////////////////////////////////////


function styleUnitVarValsStore(store) {
    store.on('styleUnitVarVals/init',
    /**
     * @param {Object} state
     * @param {[Array<StyleUnitVarValues>]} args
     * @returns {{styleUnitVarVals: Array<StyleUnitVarValues>; [otherStateBuckets: String]: any;}}
     */
    (_state, [styleUnitVarVals]) =>
        ({styleUnitVarVals})
    );

    store.on('styleUnitVarVals/addItem',
    /**
     * @param {Object} state
     * @param {[StyleUnitVarValues]} args
     * @returns {{styleUnitVarVals: Array<StyleUnitVarValues>; [otherStateBuckets: String]: any;}}
     */
    ({styleUnitVarVals}, [newItem]) =>
        ({styleUnitVarVals: [...styleUnitVarVals, newItem]})
    );
}


////////////////////////////////////////////////////////////////////////////////


const mainStore = createStoreon([
    themeStylesStore,
    reusableBranchesStore,
    theWebsiteBasicInfoStore,
    theBlockTreeStore,
    styleUnitMetasStore,
    styleUnitVarValsStore,
    pagesListingsStore,
]);

/**
 * @param {String} namespace
 * @param {(state: Object, eventInfo: [String, Array<any>, Object]) => void} fn
 * @returns {() => void} unregister
 */
function observeStore(namespace, fn) {
    let nextChangeArgs = null;
    const unreg1 = mainStore.on('@dispatch', (_state, args) => {
        if (!nextChangeArgs && args[0] !== '@changed' && args[0].startsWith(`${namespace}/`))
            nextChangeArgs = args; // [String, any]
    });
    const unreg2 = mainStore.on('@changed', (state, changes) => {
        if (nextChangeArgs) {
            fn(state, nextChangeArgs.concat(changes));
            nextChangeArgs = null;
        }
    });
    return () => {
        unreg2();
        unreg1();
    };
}

export default mainStore;
export {observeStore};
