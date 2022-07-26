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
        ({themeStyles: [style].concat(themeStyles)})
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
            i !== toAddIdx ? s : Object.assign({}, s, {units: [unit].concat(s.units)})
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
        return {themeStyles: themeStyles.map((s, i) =>
            i !== toRemIdx ? s : Object.assign({}, s, {units: s.units.filter(({title}) => title !== unit.title)})
        )};
    });

    store.on('themeStyles/updateUnitOf',
    /**
     * @param {Object} state
     * @param {[String, String, {[key: String]: any;}]} args
     * @returns {Object}
     */
    ({themeStyles}, [blockTypeName, unitTitle, newUnitData]) => {
        const toUpdIdx = findStyleIndex(themeStyles, blockTypeName);
        return {themeStyles: themeStyles.map((s, i) =>
            i !== toUpdIdx ? s : Object.assign({}, s, {units: s.units.map(u => u.title !== unitTitle ? u : Object.assign({}, u, newUnitData))})
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


const mainStore = createStoreon([themeStylesStore]);

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
