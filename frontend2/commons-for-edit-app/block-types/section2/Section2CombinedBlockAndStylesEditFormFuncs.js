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
    return colsScreeenLocalRepr.map(colsToTransferable);
}

/**
 * @param {Section2BlockColumnConfigLocalRepr} colConfig
 * @returns {Columns2BlockColumn}
 */
function colsToTransferable(colConfig) {
    return {
        width: colConfig.width,
        isVisible: colConfig.isVisible,
        align: colConfig.align,
    };
}

/**
 * @param {Array<Section2BlockColumnConfig|Section2BlockColumnConfigLocalRepr>} colConfigs
 * @param {String} colMinWidth = '0'
 * @returns {[{template: String; val: String;}, {}]}
 */
function decompose(colConfigs, colMinWidth = '0') {
    const [main, each] = decompose2(colConfigs, colMinWidth);
    return [
        {template: 'grid-template-columns: %s;', val: main},
        {} // todo
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
 * @returns {[String, Array<todo>]}
 */
function decompose2(colConfigs, colMinWidth = '0') {
    const main = (
        colConfigs.map(itm => `minmax(${colMinWidth}, ${itm.width || '1fr'})`).join(' ')
    );
    //
    const each = colConfigs.map(itm => {
        const p = [];
        if (itm.align) {
            p.push({part: 'justifySelf', cssDecl: `justify-self: ${itm.align}`});
        }
        if (!itm.isVisible) {
            p.push({part: 'visibility', cssDecl: 'visibility: hidden'});
        }
        return p;
    });
    //
    return [main, each];
}

export {
    colsScreenToTransferable,
    colsToLocalRepr,
    colsToTransferable,
    createColumnConfig,
    createStateForEachScreenSize,
    decompose,
    decompose2,
};
