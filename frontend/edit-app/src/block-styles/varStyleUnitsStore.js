function varStyleUnitsStore(store) {
    store.on('varStyleUnits/init',
    /**
     * @param {Object} state
     * @param {[Array<VarStyleUnit>]} args
     * @returns {{varStyleUnits: Array<VarStyleUnit>; [otherStateBucketKey: String]: any;}}
     */
    (_state, [varStyleUnits]) =>
        ({varStyleUnits})
    );

    store.on('varStyleUnits/addItem',
    /**
     * @param {Object} state
     * @param {[VarStyleUnit]} args
     * @returns {{varStyleUnits: Array<VarStyleUnit>; [otherStateBucketKey: String]: any;}}
     */
    ({varStyleUnits}, [newItem]) =>
        ({varStyleUnits: [...varStyleUnits, newItem]})
    );

    store.on('varStyleUnits/updateItem',
    /**
     * @param {Object} state
     * @param {[VarStyleUnit]} args
     * @returns {{varStyleUnits: Array<VarStyleUnit>; [otherStateBucketKey: String]: any;}}
     */
    ({varStyleUnits}, [updated]) =>
        ({varStyleUnits: varStyleUnits.map(unit => unit.id !== updated.id ? unit : updated)})
    );

    store.on('varStyleUnits/removeItem',
    /**
     * @param {Object} state
     * @param {[String]} args
     * @returns {{varStyleUnits: Array<VarStyleUnit>; [otherStateBucketKey: String]: any;}}
     */
    ({varStyleUnits}, [id]) =>
        ({varStyleUnits: varStyleUnits.filter(unit => unit.id !== id)})
    );

    store.on('varStyleUnits/addValueTo',
    /**
     * @param {Object} state
     * @param {[String, UnitVarValue]} args
     * @returns {{varStyleUnits: Array<VarStyleUnit>; [otherStateBucketKey: String]: any;}}
     */
    ({varStyleUnits}, [varUnitId, valToAdd]) => ({varStyleUnits: varStyleUnits.map(unit => {
        if (unit.id !== varUnitId) return unit;
        const newVals = [...unit.values, valToAdd];
        return {...unit, ...{values: newVals}, generatedCss: varStyleUnitToString(newVals, varUnitId)};
    })}));

    store.on('varStyleUnits/updateValueIn',
    /**
     * @param {Object} state
     * @param {[String, UnitVarValue]} args
     * @returns {{varStyleUnits: Array<VarStyleUnit>; [otherStateBucketKey: String]: any;}}
     */
    ({varStyleUnits}, [varUnitId, valToUpdate]) => ({varStyleUnits: varStyleUnits.map(unit => {
        if (unit.id !== varUnitId) return unit;
        const newVals = unit.values.map(v => v.varName !== valToUpdate.varName ? v : {...valToUpdate});
        return {...unit, ...{values: newVals}, generatedCss: varStyleUnitToString(newVals, varUnitId)};
    })}));


    store.on('varStyleUnits/removeValueFrom',
    /**
     * @param {Object} state
     * @param {[String, UnitVarValue]} args
     * @returns {{varStyleUnits: Array<VarStyleUnit>; [otherStateBucketKey: String]: any;}}
     */
    ({varStyleUnits}, [varUnitId, {varName}]) => {
        const out = [];
        for (const vu of varStyleUnits) {
            if (vu.id !== varUnitId)
                out.push(vu);
            else {
                const newVals = vu.values.filter(v => v.varName !== varName);
                if (newVals.length) {
                    out.push({...vu, ...{values: newVals}, generatedCss: varStyleUnitToString(newVals, varUnitId)});
                } // else do not push to out
            }
        }
        return {varStyleUnits: out};
    });
}

/**
 * @param {Array<UnitVarValue>} varValues
 * @param {String} varStyleUnitId
 * @returns {String}
*/
function varStyleUnitToString(varValues, varStyleUnitId) {
    return `.${varStyleUnitId} { ${varValues.map(v => {
        return `--${v.varName}: ${v.value}`;
    }).join('; ')} }`;
}

export default varStyleUnitsStore;
export {varStyleUnitToString};
