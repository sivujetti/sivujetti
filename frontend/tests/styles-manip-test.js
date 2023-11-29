import {splitToScreenSizeParts, joinFromScreenSizeParts,
        expandToInternalRepr, optimizeFromInternalRepr} from '../../frontend/edit-app/src/left-column/styles-tabs/scss-manip-funcs.js';

QUnit.module('styles-manip-test.js', () => {
    QUnit.test('splitToScreenSizeParts() splits scss to parts', assert => {
        const scss = (
            'color: lime;' +
            '@media (max-width: 960px) {\n' +
                'color: red;' +
            '}\n' +
            '@media (max-width: 840px) {\n' +
            '}\n' +
            '@media (max-width: 600px) {\n' +
            '}\n' +
            '@media (max-width: 480px) {\n' +
            '}\n'
        );
        const result = splitToScreenSizeParts(scss);
        const [all, large, medium, small, extraSmall] = result;
        assert.equal(all,        'color: lime;');
        assert.equal(large,      'color: red;');
        assert.equal(medium,     '');
        assert.equal(small,      '');
        assert.equal(extraSmall, '');
    });
    QUnit.test('joinFromScreenSizeParts() joins scss parts to string', assert => {
        [
            [
                [
                    'color: blue;',
                    'color: green;',
                    '',
                    '',
                    ''
                ],
                'color: blue;' +
                '@media (max-width: 960px) {\n' +
                    'color: green;' +
                '}\n' +
                '@media (max-width: 840px) {\n' +
                '}\n' +
                '@media (max-width: 600px) {\n' +
                '}\n' +
                '@media (max-width: 480px) {\n' +
                '}\n'
            ],
            [
                [
                    'color: yellow;',
                    '',
                    'color: green;',
                    '',
                    ''
                ],
                'color: yellow;' +
                '@media (max-width: 960px) {\n' +
                '}\n' +
                '@media (max-width: 840px) {\n' +
                    'color: green;' +
                '}\n' +
                '@media (max-width: 600px) {\n' +
                '}\n' +
                '@media (max-width: 480px) {\n' +
                '}\n'
            ],
            [
                [
                    '',
                    'color: green;\n' + 'background: red;',
                    'color: blue;',
                    '',
                    ''
                ],
                '' +
                '@media (max-width: 960px) {\n' +
                    'color: green;\n' + 'background: red;' +
                '}\n' +
                '@media (max-width: 840px) {\n' +
                    'color: blue;' +
                '}\n' +
                '@media (max-width: 600px) {\n' +
                '}\n' +
                '@media (max-width: 480px) {\n' +
                '}\n'
            ],
            [
                [
                    '',
                    '' +
                    '',
                    '',
                    '',
                    ''
                ],
                '' +
                '@media (max-width: 960px) {\n' +
                '}\n' +
                '@media (max-width: 840px) {\n' +
                '}\n' +
                '@media (max-width: 600px) {\n' +
                '}\n' +
                '@media (max-width: 480px) {\n' +
                '}\n'
            ],
            [
                [
                    '--no-semi: foo',
                    '--no-semi-trailing-whitespace: bar  ',
                    '  --no-semi-leading-whitespace: bar',
                    '  --no-semi-both-whitespace: bar ',
                    '',
                ],
                '--no-semi: foo;' +
                '@media (max-width: 960px) {\n' +
                    '--no-semi-trailing-whitespace: bar  ;' +
                '}\n' +
                '@media (max-width: 840px) {\n' +
                    '  --no-semi-leading-whitespace: bar;' +
                '}\n' +
                '@media (max-width: 600px) {\n' +
                    '  --no-semi-both-whitespace: bar ;' +
                '}\n' +
                '@media (max-width: 480px) {\n' +
                '}\n'
            ],
            [
                [
                    '> div {\n  color: red\n}',
                    '',
                    '',
                    '',
                    'color: lime;',
                ],
                '> div {\n  color: red\n}' +
                '@media (max-width: 960px) {\n' +
                '}\n' +
                '@media (max-width: 840px) {\n' +
                '}\n' +
                '@media (max-width: 600px) {\n' +
                '}\n' +
                '@media (max-width: 480px) {\n' +
                    'color: lime;' +
                '}\n'
            ]
        ].forEach(([parts, expected], i) => {
            const result = joinFromScreenSizeParts(parts);
            assert.equal(result, expected, `#${i}`);
        });
    });

    // ----

    QUnit.test('expandToInternalRepr(optimizedScss) returns expanded scss', assert => {
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
        const optimizedScss = [
            // '// @exportAs(option:start|center|end|unset)', // ?
            '--alignItems_Type_d1: start;',                   // <- changed var
            'align-items: var(--alignItems_Type_d1);',        // <- because changed var
            '// ^::split-marker::^ ',
            '',                                               // <- addition
            'color: red;',                                    // <- addition
            '> div {',                                        // <- addition
            '  background: blue;',                            // <- addition
            '}',                                              // <- addition
        ].join('\n');
        const expectedScss = [
            '// @exportAs(option:start|center|end|unset)',
            '--alignItems_Type_d1: start;',                   // <- replace name + value
            '// @exportAs(color)',
            '--color_Type_d1: unset;',                        // <- replace name
            '// @exportAs(color)',
            '--bg_Type_d1: unset;',                           // <- replace name
            '',
            'align-items: var(--alignItems_Type_d1);',        // <- replace name
            'background-color: var(--bg_Type_d1);',           // <- replace name
            '',
            '> div {',
            '  color: var(--color_Type_d1);',                 // <- replace name
            '}',
            '// ^::split-marker::^ ',
            '',                                               // <- addition
            'color: red;',                                    // <- addition
            '> div {',                                        // <- addition
            '  background: blue;',                            // <- addition
            '}',                                              // <- addition
        ].join('\n');
        //
        const result = expandToInternalRepr(optimizedScss, baseScss, 'd1');
        assert.equal(result, expectedScss);
    });

    QUnit.test('optimizeFromInternalRepr(expandedScss) returns optimized scss', assert => {
        const expandedScss = [
            '// @exportAs(option:start|center|end|unset)',
            '--alignItems_Type_d1: start;',                   // <- replace name + value
            '// @exportAs(color)',
            '--color_Type_d1: unset;',                        // <- replace name
            '// @exportAs(color)',
            '--bg_Type_d1: unset;',                           // <- replace name
            '',
            'align-items: var(--alignItems_Type_d1);',        // <- replace name
            'background-color: var(--bg_Type_d1);',           // <- replace name
            '',
            '> div {',
            '  color: var(--color_Type_d1);',                 // <- replace name
            '}',
            '// ^::split-marker::^ ',
            '',                                               // <- addition
            'color: red;',                                    // <- addition
            '> div {',                                        // <- addition
            '  background: blue;',                            // <- addition
            '}',                                              // <- addition
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
            // '// @exportAs(option:start|center|end|unset)', // ?
            '--alignItems_Type_d1: start;',                   // <- changed var
            'align-items: var(--alignItems_Type_d1);',        // <- because changed var
            '// ^::split-marker::^ ',
            '',                                               // <- addition
            'color: red;',                                    // <- addition
            '> div {',                                        // <- addition
            '  background: blue;',                            // <- addition
            '}',                                              // <- addition
        ].join('\n');
        //
        const result = optimizeFromInternalRepr(expandedScss, baseScss);
        assert.equal(result, expectedScss);
    });
});
