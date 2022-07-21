const {createStoreon} = window.storeon;

function themeStyles(store) {
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
    (_state, [style]) =>
        ({themeStyles: [style].concat(themeStyles)})
    );

    store.on('themeStyles/addUnitTo',
    /**
     * @param {Object} state
     * @param {[String, ThemeStyleUnit]} args
     * @returns {Object}
     */
    ({themeStyles}, [blockTypeName, unit]) => {
        const toAddIdx = themeStyles.findIndex((s) => s.blockTypeName === blockTypeName);
        return {themeStyles: themeStyles.map((s, i) =>
            i !== toAddIdx ? s : Object.assign({}, s, {units: [unit].concat(s.units)})
        )};
    });
}

///////

const mainStore = createStoreon([themeStyles]);

/**
 * @param {String} namespace
 * @param {(state: Object, [String, Object, Object]) => void} fn
 * @returns {() => void} unregister
 */
function observeStore(namespace, fn) {
    let nextChangeArgs = null;
    const unreg1 = mainStore.on('@dispatch', (_state, args) => {
        if (!nextChangeArgs && args[0] !== '@changed' && args[0].startsWith(`${namespace}/`))
            nextChangeArgs = args;
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
