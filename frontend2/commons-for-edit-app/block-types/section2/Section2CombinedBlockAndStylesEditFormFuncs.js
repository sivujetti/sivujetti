const innerElScope = '>.j-Section2-cols';

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
 * @returns {{mainEl: {template: String; val: String;}; innerEls: Array<{align: {template: String; val: String|null;}; visibility: {template: String; val: 'hidden'|null;};}>;}}
 */
function toStyleConfig(colConfigs, colMinWidth = '0') {
    const mainEl = {
        template: [
            `${innerElScope} {`,
            `  grid-template-columns: %s;`,
            `}`
        ].join('\n'),
        val: colConfigs.map(itm => `minmax(${colMinWidth}, ${itm.width || '1fr'})`).join(' '),
    };
    //
    const innerEls = colConfigs.map((itm, i) => ({
        align: {
            template: [
                `${innerElScope}>:nth-child(${i + 1}) {`,
                `  justify-self: %s;`,
                `}`
            ].join('\n'),
            val: itm.align,
        },
        visibility: {
            template: [
                `${innerElScope}>:nth-child(${i + 1}) {`,
                `  visibility: %s;`,
                `}`
            ].join('\n'),
            val: itm.isVisible ? null : 'hidden',
        },
    }));
    //
    return {mainEl, innerEls};
}

export {
    colsScreenToTransferable,
    colsToLocalRepr,
    colToTransferable,
    createColumnConfig,
    createStateForEachScreenSize,
    innerElScope,
    toStyleConfig,
};
