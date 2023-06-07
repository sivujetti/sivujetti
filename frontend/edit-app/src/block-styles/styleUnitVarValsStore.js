function styleUnitVarValsStore(store) {
    store.on('styleUnitVarVals/init',
    /**
     * @param {Object} state
     * @param {[Array<StyleUnitVarValues>]} args
     * @returns {{styleUnitVarVals: Array<StyleUnitVarValues>; [otherStateBucketKey: String]: any;}}
     */
    (_state, [styleUnitVarVals]) =>
        ({styleUnitVarVals})
    );

    store.on('styleUnitVarVals/addItem',
    /**
     * @param {Object} state
     * @param {[StyleUnitVarValues]} args
     * @returns {{styleUnitVarVals: Array<StyleUnitVarValues>; [otherStateBucketKey: String]: any;}}
     */
    ({styleUnitVarVals}, [newItem]) =>
        ({styleUnitVarVals: [...styleUnitVarVals, newItem]})
    );

    store.on('styleUnitVarVals/removeItem',
    /**
     * @param {Object} state
     * @param {[String]} args
     * @returns {{styleUnitVarVals: Array<StyleUnitVarValues>; [otherStateBucketKey: String]: any;}}
     */
    ({styleUnitVarVals}, [id]) =>
        ({styleUnitVarVals: styleUnitVarVals.filter(vv => vv.id !== id)})
    );

    store.on('styleUnitVarVals/updateValueIn',
    /**
     * @param {Object} state
     * @param {[String, UnitVarValue]} args
     * @returns {{styleUnitVarVals: Array<StyleUnitVarValues>; [otherStateBucketKey: String]: any;}}
     */
    ({styleUnitVarVals}, [varValsId, valToUpdate]) => ({styleUnitVarVals: styleUnitVarVals.map(vv => {
        if (vv.id !== varValsId) return vv;
        const newVals = vv.values.map(v => v.varName !== valToUpdate.varName ? v : {...valToUpdate});
        return {...vv, ...{values: newVals}, generatedCss: varValsToString(newVals, varValsId)};
    })}));
}

/**
 * @param {Array<UnitVarValue>} varValues
 * @param {StyleUnitMeta} meta
 * @returns {String}
*/
function varValsToString(varValues, varValsId) {
    return `.${varValsId} { ${varValues.map(v => {
        return `--${v.varName}: ${v.value}`;
    }).join('; ')} }`;
}

export default styleUnitVarValsStore;
export {varValsToString};
