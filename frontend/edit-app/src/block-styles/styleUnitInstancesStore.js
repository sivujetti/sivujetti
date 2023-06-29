function styleUnitInstancesStore(store) {
    store.on('styleUnitInstances/init',
    /**
     * @param {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}} state
     * @param {[Array<StyleUnitInstance>]} args
     * @returns {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}}
     */
    (_state, [styleUnitInstances]) =>
        ({styleUnitInstances})
    );

    store.on('styleUnitInstances/addItem',
    /**
     * @param {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}} state
     * @param {[StyleUnitInstance]} args
     * @returns {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}}
     */
    ({styleUnitInstances}, [newItem]) =>
        ({styleUnitInstances: [...styleUnitInstances, newItem]})
    );

    store.on('styleUnitInstances/updateValuesOf',
    /**
     * @param {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}} state
     * @param {[String, Array<UnitVarValue>, String]} args
     * @returns {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}}
     */
    ({styleUnitInstances}, [id, newValues, newGeneratedCss]) => ({styleUnitInstances: styleUnitInstances.map(unit => {
        if (unit.id !== id) return unit;
        return {...unit, ...{values: newValues}, generatedCss: newGeneratedCss};
    })}));

    store.on('styleUnitInstances/removeItem',
    /**
     * @param {Object} state
     * @param {[String]} args
     * @returns {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}}
     */
    ({styleUnitInstances}, [id]) =>
        ({styleUnitInstances: styleUnitInstances.filter(unit => unit.id !== id)})
    );
}

export default styleUnitInstancesStore;
