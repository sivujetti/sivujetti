const innerElScope = '> .j-Section2-cols';

/**
 * @returns {ColumnConfig}
 */
function createColumnConfig() {
    return {
        width: '1fr',
        align: null,
        visibility: null,
    };
}

/**
 * @param {Array<ColumnConfig>} columns
 * @returns {Array<String>} Example ['>.j-Section2-cols {', 'grid-template-columns: minmax(0, 1fr);', '}', '>.j-Section2-cols>:nth-child(1) {', 'justify-self: end;', 'visibility: visible;', '}']
 */
function columnsToScss(columns) {
    const scopeNormalized = innerElScope.replace('> ', '>');
    const lines = [
        `${scopeNormalized} {`,
        `  grid-template-columns: ${columnsToWidthCss(columns)};`,
        '}',
    ];
    columns.forEach((col, i) => {
        const innerLines = [
            ...(col.align ? [`  justify-self: ${col.align};`] : []),
            ...(col.visibility ? [`  visibility: ${col.visibility};`] : []),
        ];
        if (innerLines.length) {
            lines.push(
                `${scopeNormalized}>:nth-child(${i + 1}) {`,
                    ...innerLines,
                '}'
            );
        }
    });
    return lines;
}

/**
 * @param {Array<ColumnConfig>} columns
 * @param {String} colMinWidth = '0'
 * @returns {String|null}
 */
function columnsToWidthCss(columns, colMinWidth = '0') {
    return columns ? `${columns.map(itm => `minmax(${colMinWidth}, ${itm.width || '1fr'})`).join(' ')}` : null;
}

/**
 * @typedef ColumnConfig
 * @prop {String} width      // Example '1fr', '120px'
 * @prop {String|null} align
 * @prop {'hidden'|'visible'|String|null} visibility
 */

export {
    columnsToScss,
    columnsToWidthCss,
    createColumnConfig,
    innerElScope,
};
