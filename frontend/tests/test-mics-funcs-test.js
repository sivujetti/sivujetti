import {replaceLastIndexOf} from '../webpage/src/ReRenderer.js';

QUnit.module('misc-funcs', () => {
    QUnit.test('replaceLastIndexOf() replaces substring', assert => {
        [
            ['aa bb', 'bb', 'cc', 'aa cc'],
            ['aa bb', 'bb', '', 'aa '],
            ['aa bb', 'aa', 'cc', 'cc bb'],
            ['aa bb', 'aa', '', ' bb'],
            ['aa bb', ' b', ' c', 'aa cb'],
            ['aa bb', 'b', 'c', 'aa bc'],
            ['aa bb', 'a', 'c', 'ac bb'],
        ].forEach(([full, replace, replaceWith, expected], i) => {
            const result = replaceLastIndexOf(full, replace, replaceWith);
            assert.equal(result, expected, `#${i}`);
        });
    });
});