/**
 * @param {String} derivedScss
 * @param {String} baseScss
 * @returns {String}
 */
function optimizeScss(derivedScss, baseScss) {
    const EMPTY_LINE = '^::empty::^';

    const ir = [];
    runLinesAb(derivedScss, baseScss, (event, arg1, arg2, arg3, arg4, arg5) => {
        if (event === 'varDeclLine') {
            const isSame = arg1;
            const lineANotTrimmed = arg4;
            ir.push(isSame ? EMPTY_LINE : lineANotTrimmed);
        // derived, add only if the line contains var(--someChangedVar), or ensWith '{' or '}'
        } else if (event === 'derivedUsageLine') {
            let hasUsageWithChagedVal = false;
            const lineATrimmed = arg1;
            const varDecls = arg2;
            const linesA = arg3;
            const linesB = arg4;
            const lineANotTrimmed = arg5;
            const end = lineATrimmed.at(-1);
            if (end !== '{' && end !== '}') {
                const pcs1 = lineATrimmed.split('var(');
                if (pcs1.length > 1) {
                    // 'align-items: var(  --varName...)' -> '--varName...'
                    const start = pcs1[1].trimStart();
                    // ['--alignItems', 'Type', 'd1 )'] or
                    // ['--alignItems', 'Type', 'd1, var(--another) )'] or
                    // ['--columns', 'Listing', 'd1 ), minmax(0, 1fr) );']
                    const pcs3 = start.split('_').slice(0, 3);
                    if (pcs3.length === 3) {
                        // 'd1 )'                   -> 'd1' or
                        // 'd1, var(--another))'    -> 'd1' or
                        // 'd1 ), minmax(0, 1fr));' -> 'd1'
                        pcs3[2] = pcs3[2].split(',')[0].trimEnd().split(')')[0].trimEnd();
                        const [_, blockTypeName, apdx] = pcs3;
                        const usageVarName = pcs3.join('_');
                        const varDeclLineN = varDecls.indexOf(usageVarName);
                        hasUsageWithChagedVal = varDeclLineN > -1 && linesA[varDeclLineN].trim() !== withReplacedApdx(linesB[varDeclLineN].trim(), blockTypeName, apdx);
                    }
                }
            } else hasUsageWithChagedVal = true;
            ir.push(!hasUsageWithChagedVal ? EMPTY_LINE : lineANotTrimmed);
        } else if (event === 'appendedLine') {
            const lineANotTrimmed = arg1;
            ir.push(lineANotTrimmed);
        }
    });

    const withoutEmptyLines = arr => arr.filter(line => line !== EMPTY_LINE);
    const ir2 = withoutEmptyLines(ir);
    let emptied = ir2.slice(0);
    let emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(emptied);
    while (emptyBlockCloseTagIdx > 0 && emptied.length) {
        emptied[emptyBlockCloseTagIdx] = EMPTY_LINE;
        emptied[emptyBlockCloseTagIdx - 1] = EMPTY_LINE;
        emptied = withoutEmptyLines(emptied);
        emptyBlockCloseTagIdx = findEmptyBlockClosingTagIndex(emptied);
    }
    return emptied.join('\n');
}
/**
 * @param {Array<String>} lines
 * @returns {Number}
 */
function findEmptyBlockClosingTagIndex(lines) {
    for (let l = lines.length; --l > -1; ) {
        const line = lines[l];
        if (line.trim() === '}') {
            const prev = lines[l - 1];
            if (prev.trimEnd().at(-1) === '{') return l;
        }
    }
    return -1;
}

/**
 * @param {String} lineB Example '--background_Section_base1: initial;'
 * @param {String} blockTypeName Example 'Section'
 * @param {String} apdx Example 'u4'
 * @return {String} Example '--background_Section_u4: initial;'
 */
function withReplacedApdx(lineB, blockTypeName, apdx) {
    return lineB.replace(new RegExp(`${blockTypeName}_(base|default)\\d+`), `${blockTypeName}_${apdx}`);
}

/**
 * @param {String} derivedScss
 * @param {String} baseScss
 * @param {(todo) => void} on
 */
function runLinesAb(derivedScss, baseScss, on) {
    const linesA = derivedScss.split('\n');
    const linesB = baseScss.split('\n');
    const numBaseLines = linesB.length;

    const varDecls = [];
    for (let i = 0; i < linesA.length; ++i) {
        const trimmed = linesA[i].trimStart();
        if (trimmed.startsWith('--')) {
            const pcs = trimmed.split(':');
            if (pcs[1]?.trim().length > 0) {
                const prev = linesA[i - 1] || '';
                if (prev.indexOf('@exportAs(') > -1) {
                    varDecls.push(pcs[0].trimEnd()); // '--foo'
                    varDecls[i - 1] = prev; // '@exportAs'
                    continue;
                } // else fall through
            } // else fall through
        }
        varDecls.push(null);
    }

    for (let i = 0; i < linesA.length; ++i) {
        const fromDerivate = linesA[i];
        const lineATrimmed = fromDerivate.trim();
        const isDerivedLine = i < numBaseLines;

        // '--myVar: foo;' or '// @exportAs(...)'
        if (varDecls[i] !== null) {
            if (!fromDerivate.startsWith('--')) { // '// @exportAs(...)'
                on('varDeclLine', true, '', '', fromDerivate);
                continue;
            }
            if (isDerivedLine) {
                const lineB = withReplacedApdx(linesB[i].trim(), ...varDecls[i].split('_').slice(1));
                const isSame = lineATrimmed === lineB;
                on('varDeclLine', isSame, lineATrimmed, lineB, fromDerivate);
            } else { // addition
                on('varDeclLine', false, lineATrimmed, '', fromDerivate);
            }
        } else {
            if (isDerivedLine) {
                on('derivedUsageLine', lineATrimmed, varDecls, linesA, linesB, fromDerivate);
            } else { // addition
                on('appendedLine', fromDerivate);
            }
        }
    }
}

export {optimizeScss};
