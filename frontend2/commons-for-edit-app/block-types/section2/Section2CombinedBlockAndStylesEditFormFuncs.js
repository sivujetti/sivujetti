/**
 * @param {[Array<Section2BlockColumnConfig>|null, Array<Section2BlockColumnConfig>|null, Array<Section2BlockColumnConfig>|null, Array<Section2BlockColumnConfig>|null, Array<Section2BlockColumnConfig>|null]} screenColumnsSettings [<all>, <lg>, <md> etc.]
 * @returns {section2ColConfigsAllScreens}
 */
function createStateForEachScreenSize(screenColumnsSettings) {
    return screenColumnsSettings.map(cols => {
        return cols !== null ? colsToLocalRepr(cols) : null;
    });
}

/**
 * @param {Array<Section2BlockColumnConfig>} transferableCols
 * @returns {Array<Section2BlockColumnConfigLocalRepr>}
 */
function colsToLocalRepr(transferableCols) {
    return transferableCols.map((col, i) => ({
        ...col,
        id: `col-${i}`
    }));
}

/**
 * @returns {Section2BlockColumnConfig}
 */
function createColumnConfig() {
    return {
        width: '1fr',
        align: null,
        isVisible: true,
    };
}

/**
 * @param {Array<Section2BlockColumnConfigLocalRepr>} colsScreeenLocalRepr
 * @returns {Array<Section2BlockColumnConfig>}
 */
function colsScreenToTransferable(colsScreeenLocalRepr) {
    return colsScreeenLocalRepr.map(colToTransferable);
}

/**
 * @param {Section2BlockColumnConfigLocalRepr} colConfig
 * @returns {Columns2BlockColumn}
 */
function colToTransferable(colConfig) {
    return {
        width: colConfig.width,
        align: colConfig.align,
        isVisible: colConfig.isVisible,
    };
}

/**
 * @param {Array<Section2BlockColumnConfig|Section2BlockColumnConfigLocalRepr>} colConfigs
 * @param {String} colMinWidth = '0'
 * @returns {[{template: String; val: String;}, Array<{align: String|undefined; isVisible: Boolean|undefined;}>]}
 */
function decompose(colConfigs, colMinWidth = '0') {
    const [main, each] = decompose2(colConfigs, colMinWidth);
    return [
        {template: 'grid-template-columns: %s;', val: main},
        each
    ];
}

/**
 * Examples:
 * ```
 * [{width: null, align: 'end', isVisible: true}]
 * ->
 * [
 *   '1fr',
 *   [
 *       [{part: 'justifySelf', cssDecl: 'justify-self: end'}],
 *   ]
 * ]
 *
 * [
 *     {width: null, align: null, isVisible: true},
 *     {width: null, align: 'end', isVisible: false},
 * ]
 * ->
 * [
 *   '1fr 1fr',
 *   [
 *       [],
 *       [{part: 'justifySelf', cssDecl: 'justify-self: end'}, {part: 'visibility', cssDecl: 'visibility: hidden'}],
 *   ]
 * ]
 * ```
 * @param {Array<Section2BlockColumnConfig|Section2BlockColumnConfigLocalRepr>} colConfigs
 * @returns {[String, Array<{align: String|undefined; isVisible: Boolean|undefined;}>]}
 */
function decompose2(colConfigs, colMinWidth = '0') {
    const main = (
        colConfigs.map(itm => `minmax(${colMinWidth}, ${itm.width || '1fr'})`).join(' ')
    );
    //
    const each = colConfigs.map(itm => ({
        align: itm.align || undefined,
        isVisible: itm.isVisible || undefined,
    }));
    //
    return [main, each];
}

export {
    colsScreenToTransferable,
    colsToLocalRepr,
    colToTransferable,
    createColumnConfig,
    createStateForEachScreenSize,
    decompose,
    decompose2,
};
