import {optimizeScss} from '../edit-app/src/left-column/block/styles-shared.jsx';

QUnit.module('StylesList.jsx', () => {
    QUnit.test('optimizeScss() removes unchanged lines', assert => {
        const derivateScss = [
            '// @exportAs(option:start|center|end|unset)',
            '--alignItems_Type_d1: start;',         // <- overridden
            '// @exportAs(color)',
            '--color_Type_d1: unset;',
            '// @exportAs(color)',
            '--bg_Type_d1: unset;',
            '',
            'align-items: var(--alignItems_Type_d1);',
            'background-color: var(--bg_Type_d1);',
            '',
            '> div {',
            '  color: var(--color_Type_d1);',
            '}',
            '',                                     // <- custom additions
            'color: red;',                          // <-
            '> div {',                              // <-
            '  background: blue;',                  // <-
            '}',                                    // <-
        ].join('\n');
        const baseScss = [
            '// @exportAs(option:start|center|end|unset)',
            '--alignItems_Type_base1: end;',
            '// @exportAs(color)',
            '--color_Type_base1: unset;',
            '// @exportAs(color)',
            '--bg_Type_base1: unset;',
            '',
            'align-items: var(--alignItems_Type_base1);',
            'background-color: var(--bg_Type_base1);',
            '',
            '> div {',
            '  color: var(--color_Type_base1);',
            '}',
        ].join('\n');
        const expectedScss = [
            // '// @exportAs(option:start|center|end|unset)', // <- remove
            '--alignItems_Type_d1: start;',                   // <- keep
            // '// @exportAs(color)',                         // -> remove
            // '--color_Type_d1: unset;',                     // -> remove
            // '// @exportAs(color)',                         // -> remove
            // '--bg_Type_d1: unset;',                        // -> remove
            // '',                                            // -> remove
            'align-items: var(--alignItems_Type_d1);',        // -> keep (because changed var)
            // 'background-color: var(--bg_Type_d1);',        // -> remove
            // '',                                            // -> remove
            // '> div {',                                     // -> remove
            // '  color: var(--color_Type_d1);',              // -> remove
            // '}',                                           // -> remove
            '',                                               // <- keep
            'color: red;',                                    // <- keep
            '> div {',                                        // <- keep
            '  background: blue;',                            // <- keep
            '}',                                              // <- keep
        ].join('\n');
        //
        const result = optimizeScss(derivateScss, [], baseScss);
        assert.equal(result, expectedScss);
    });
    QUnit.test('optimizeScss() removes unchanged lines2', assert => {
        const derivateScss = [
            '// @exportAs(color)',
            '--color_Type_d1: unset;',
            '// @exportAs(color)',
            '--bg_Type_d1: #000;',                  // <- overridden
            '',
            'color: var(--color_Type_d1);',
            'background-color: var(--bg_Type_d1);',
        ].join('\n');
        const baseScss = [
            '// @exportAs(color)',
            '--color_Type_default1: unset;',
            '// @exportAs(color)',
            '--bg_Type_default1: unset;',
            '',
            'color: var(--color_Type_default1);',
            'background-color: var(--bg_Type_default1);',
        ].join('\n');
        const expectedScss = [
            // '// @exportAs(color)',               // <- remove
            // '--color_Type_d1: unset;',           // <- remove
            // '// @exportAs(color)',               // <- remove
            '--bg_Type_d1: #000;',                  // <- keep
            // '',                                  // <- remove
            // 'color: var(--color_Type_d1);',      // <- remove
            'background-color: var(--bg_Type_d1);', // <- keep (because changed var)
        ].join('\n');
        //
        const result = optimizeScss(derivateScss, [], baseScss);
        assert.equal(result, expectedScss);
    });
    QUnit.test('opimizes scss3', assert => {
        const derivateScss = [
            '// @exportAs(color)',
            '--color_Type_d1: unset;',
            '// @exportAs(color)',
            '--bg_Type_d1: #000;',                  // <- overridden
            '',
            'background-color: var(--bg_Type_d1);',
            'color: var(--color_Type_d1);',
        ].join('\n');
        const baseScss = [
            '// @exportAs(color)',
            '--color_Type_default1: unset;',
            '// @exportAs(color)',
            '--bg_Type_default1: unset;',
            '',
            'background-color: var(--bg_Type_default1);',
            'color: var(--color_Type_default1);',
        ].join('\n');
        const expectedScss = [
            // '// @exportAs(color)',               // <- remove
            // '--color_Type_d1: unset;',           // <- remove
            // '// @exportAs(color)',               // <- remove
            '--bg_Type_d1: #000;',                  // <- keep
            // '',                                  // <- remove
            'background-color: var(--bg_Type_d1);', // <- keep (because changed var)
            // 'color: var(--color_Type_d1);',      // <- remove
        ].join('\n');
        //
        const result = optimizeScss(derivateScss, [], baseScss);
        assert.equal(result, expectedScss);
    });
});
