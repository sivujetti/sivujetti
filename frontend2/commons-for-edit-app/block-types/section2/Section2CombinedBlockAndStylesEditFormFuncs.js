const innerElScope = '> .j-Section2-cols';

/**
 * @param {[Array<ColumnConfig>|null, Array<ColumnConfig>|null, Array<ColumnConfig>|null, Array<ColumnConfig>|null, Array<ColumnConfig>|null]} screenColumnsSettings [<all>, <lg>, <md> etc.]
 * @returns {section2ColConfigsAllScreens}
 */
function createStateForEachScreenSize(screenColumnsSettings) {
    return screenColumnsSettings.map(cols => {
        return cols !== null ? colsToLocalRepr(cols) : null;
    });
}

/**
 * @param {Array<ColumnConfig>} transferableCols
 * @returns {Array<ColumnConfigLocalRepr>}
 */
function colsToLocalRepr(transferableCols) {
    return transferableCols.map((col, i) => ({
        ...col,
        id: `col-${i}`
    }));
}

/**
 * @returns {ColumnConfig}
 */
function createColumnConfig() {
    return {
        width: '1fr',
        align: null,
        isVisible: true,
    };
}

/**
 * @param {Array<ColumnConfigLocalRepr>} colsScreeenLocalRepr
 * @returns {Array<ColumnConfig>}
 */
function colsScreenToTransferable(colsScreeenLocalRepr) {
    return colsScreeenLocalRepr.map(colToTransferable);
}

/**
 * @param {ColumnConfigLocalRepr} colConfig
 * @returns {ColumnConfig}
 */
function colToTransferable(colConfig) {
    return {
        width: colConfig.width,
        align: colConfig.align,
        isVisible: colConfig.isVisible,
    };
}

/**
 * @param {Array<ColumnConfig|ColumnConfigLocalRepr>} colConfigs
 * @param {String} colMinWidth = '0'
 * @returns {{mainEl: {template: String; val: String;}; innerEls: Array<{align: {template: String; val: String|null;}; visibility: {template: String; val: 'hidden'|null;};}>;}}
 */
function toStyleConfig(colConfigs, colMinWidth = '0') {
    const mainEl = {
        template: 'grid-template-columns: %s;',
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

/**
 * @typedef ColumnConfig
 * @prop {String} width      // Example '1fr', '120px'
 * @prop {String|null} align
 * @prop {Boolean} isVisible
 *
 * @typedef {ColumnConfig & {id: String}} ColumnConfigLocalRepr
 *
 * @typedef {[Array<ColumnConfigLocalRepr>|null, Array<ColumnConfigLocalRepr>|null, Array<ColumnConfigLocalRepr>|null, Array<ColumnConfigLocalRepr>|null, Array<ColumnConfigLocalRepr>|null]} section2ColConfigsAllScreens
 */

export {
    colsScreenToTransferable,
    colsToLocalRepr,
    colToTransferable,
    createColumnConfig,
    createStateForEachScreenSize,
    innerElScope,
    toStyleConfig,
};
