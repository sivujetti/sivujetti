import {optimizeScss} from './scss-manip-funcs-legacy.js';

const OPT_SCSS_SPLIT_MARKER = '\n// ^::split-marker::^ \n';

/**
 * @param {String} scss
 * @returns {[String, String, String, String, String]} [all, large, medium, small, extraSmall]
 */
function splitToScreenSizeParts(scss) {
    /*
    <baseScss>NO_EOL
    <additionsScss>NO_EOL
    @media (max-width: 960px) {\n}\n
    @media (max-width: 840px) {\n}\n
    @media (max-width: 600px) {\n}\n
    @media (max-width: 480px) {\n}
    */
    const pcs = scss.split('@media ');
    /*
    [
        '<baseScss><additionsScss>',
        '(max-width: 960px) {\n}\n',
        '(max-width: 840px) {\n}\n',
        '(max-width: 600px) {\n}\n',
        '(max-width: 480px) {\n}',
    ]
    */
    const [
        all1,
        large1,
        medium1,
        small1,
        extraSmall1,
    ] = pcs;
    //
    const start = '(max-width: NNNpx) {\n'.length;
    const end = -'}\n'.length;
    return [
        all1,
        large1.slice(start, end),
        medium1.slice(start, end),
        small1.slice(start, end),
        extraSmall1.slice(start, end),
    ];
}

/**
 * @param {[String, String, String, String, String]} parts [all, large, medium, small, extraSmall]
 * @returns {String}
 */
function joinFromScreenSizeParts(parts) {
    return [
        withSemicolon(parts[0]),
        `(max-width: 960px) {\n${withSemicolon(parts[1])}}\n`,
        `(max-width: 840px) {\n${withSemicolon(parts[2])}}\n`,
        `(max-width: 600px) {\n${withSemicolon(parts[3])}}\n`,
        `(max-width: 480px) {\n${withSemicolon(parts[4])}}\n`,
    ].join('@media ');
}

/**
 * @param {String} scss
 * @returns {String}
 */
function withSemicolon(scss) {
    if (scss.endsWith(OPT_SCSS_SPLIT_MARKER))
        return scss;
    const trimmed = scss.trim();
    const last = trimmed.length ? trimmed.at(-1) : null;
    return !last || (last === ';' || last === '}') ? scss : `${scss};`;
}

/**
 * @param {String} optimizedScss
 * @param {String} baseScss
 * @param {String} varApdx
 * @returns {String}
 */
function expandToInternalRepr(optimizedScss, baseScss, varApdx) {
    const [own, additional] = splitOptimizedFromMarker(optimizedScss);
    const baseScssWithOptApdxes = varApdx !== null ? withApdxes(baseScss, varApdx) : baseScss;
    const parenLines = baseScssWithOptApdxes.split('\n');
    //
    const ir1 = [];
    const def = parenLine => ir1.push(parenLine);
    runLines(parenLines, {
        // '// @exportAs(...'
        'varDeclLine1': def,
        // '--foo_Type_base1: ...'
        'varDeclLine2': def,
        //
        'normalLine': def,
    });
    const ir = ir1.join('\n');
    return ir + OPT_SCSS_SPLIT_MARKER + additional;
}

/**
 * @param {String} internalRepr
 * @param {String} baseScss
 * @returns {String}
 */
function optimizeFromInternalRepr(internalRepr, baseScss) {
    const [own, additions] = splitOptimizedFromMarker(internalRepr);
    const optimized = optimizeScss(own, baseScss);
    return `${optimized}${OPT_SCSS_SPLIT_MARKER}${additions}`;
}

/**
 * @param {String} optimizedScss
 * @returns {[String, String]}
 * @throws {Error}
 */
function splitOptimizedFromMarker(optimizedScss) {
    const ab = optimizedScss.split(OPT_SCSS_SPLIT_MARKER);
    if (ab.length !== 2) {
        window.console.error(optimizedScss);
        throw new Error('Failed to locate split marker from previous.');
    }
    return ab;
}

/**
 * @param {Array<String>} parenLines
 * @param {{varDeclLine1(parenLine: String): void; varDeclLine2(parenLine: String): void; normalLine(parenLine: String): void;}} handlers
 */
function runLines(parenLines, handlers) {
    const varDecls = extractVarDecls(parenLines);
    for (let i = 0; i < parenLines.length; ++i) {
        const line = parenLines[i];
        const varDeclLine = varDecls[i];
        if (varDeclLine) {
            if (varDeclLine[0] === '-') // '--foo: ...'
                handlers.varDeclLine2(line);
            else // '// @exportAs(...'
                handlers.varDeclLine1(line);
        } else {
            handlers.normalLine(line);
        }
    }
}

/**
 * @param {Array<String>} lines
 * @returns {Array<String>}
 */
function extractVarDecls(lines) {
    const varDecls = new Array(lines.length);
    for (let i = 0; i < lines.length; ++i) {
        const trimmed = lines[i].trimStart();
        if (trimmed.startsWith('--')) {
            const pcs = trimmed.split(':');
            if (pcs[1]?.trim().length > 0) {
                const prev = lines[i - 1] || '';
                if (prev.indexOf('@exportAs(') > -1) {
                    varDecls[i] = pcs[0].trimEnd(); // '--foo'
                    varDecls[i - 1] = prev; // '@exportAs'
                    continue;
                } // else fall through
            } // else fall through
        }
        varDecls[i] = null;
    }
    return varDecls;
}

/**
 * '*_Section_base|default<n>' -> '*_Section_u<n>'
 * @param {String} scss
 * @param {String} apdx
 * @returns {String}
 */
function withApdxes(scss, apdx) {
    const first = firstVarDeclToPieces(scss.split('\n')); // ['--alignItems', 'Type', 'base1: end;']
    const from = `_${first[1]}_${justApdx(first)}`; // '_Type_base1', '_Type_default1'
    const to = `_${first[1]}_${apdx}`; // '_Type_${apdx}'
    return scss.replace(new RegExp(from, 'g'), to);
}

/**
 * @param {Array<String>} lines
 * @returns {String}
 */
function firstVarDeclToPieces(lines) {
    const firstVarDecl = lines.find((l, i) => l.startsWith('--') && (lines[i - 1] || '').startsWith('// @exportAs(')) || '';
    return lineToPieces(firstVarDecl);
}

/**
 * @param {String} varDeclLine
 * @returns {String} varDeclPieces
 */
function lineToPieces(varDeclLine) {
    const pcs = varDeclLine.split('_'); // '--alignItems_Type_base1: end;' -> ['--alignItems', 'Type', 'base1: end;']
    return pcs;
}

/**
 * @param {Array<String>} varDeclPieces
 * @returns {String}
 */
function justApdx(varDeclPieces) {
    const third = varDeclPieces[2] || '';
    const pcs2 = third.split(':'); // 'base1: end;' -> ['base1', ' end;']
    return pcs2[0].trimStart();
}

export {splitToScreenSizeParts, joinFromScreenSizeParts, expandToInternalRepr,
        optimizeFromInternalRepr};
