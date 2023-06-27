function styleUnitInstancesStore(store) {
    store.on('styleUnitInstances/init',
    /**
     * @param {Object} state
     * @param {[Array<StyleUnitInstance>]} args
     * @returns {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}}
     */
    (_state, [styleUnitInstances]) =>
        ({styleUnitInstances})
    );

    store.on('styleUnitInstances/addItem',
    /**
     * @param {Object} state
     * @param {[StyleUnitInstance]} args
     * @returns {{styleUnitInstances: Array<StyleUnitInstance>; [otherStateBucketKey: String]: any;}}
     */
    ({styleUnitInstances}, [newItem]) =>
        ({styleUnitInstances: [...styleUnitInstances, newItem]})
    );

}

export default styleUnitInstancesStore;
