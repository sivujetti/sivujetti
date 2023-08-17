import {replaceVarValue} from '../edit-app/src/left-column/block/VisualStyles.jsx';
import ColorValueInput from '../edit-app/src/left-column/block/ColorValueInput.jsx';
import LengthValueInput from '../edit-app/src/left-column/block/LengthValueInput.jsx';
import OptionValueInput from '../edit-app/src/left-column/block/OptionValueInput.jsx';
const {compile} = window.stylis;

QUnit.module('VisualStyles.jsx', () => {
    QUnit.test('replaceVarValue replaces css variable value by column and line', assert => {
        const testScss = ['// line 1', '--fontSize: 1.4rem;'].join('\n');
        const testScss2 = ['// line 1', '--fontSize: 1.4rem; --another: .8;'].join('\n');
        const testScss3 = ['--fontSize: 12px;'].join('\n');
        const testScss4 = ['--fontSize: 6px ; '].join('\n');
        const replaceWith = '2.5rem';
        const cls = '.j-Heading';
        //
        const ast = compile(cls + '{' + testScss + '}');
        const astNode = ast[0].children[1]; // line 2, column 20
        const result = replaceVarValue(testScss, astNode, replaceWith);
        assert.equal(result, testScss.replace('1.4rem', replaceWith));
        //
        const ast2 = compile(cls + '{' + testScss2 + '}');
        const astNode2 = ast2[0].children[2]; // line 2, column 35
        const result2 = replaceVarValue(testScss2, astNode2, replaceWith);
        assert.equal(result2, testScss2.replace('.8', replaceWith));
        //
        const astNode3 = ast2[0].children[1]; // line 2, column 20
        const result3 = replaceVarValue(testScss2, astNode3, replaceWith);
        assert.equal(result3, testScss2.replace('1.4rem', replaceWith));
        //
        const ast3 = compile(cls + '{' + testScss3 + '}');
        const astNode4 = ast3[0].children[0]; // line 1, column 23
        const result4 = replaceVarValue(testScss3, astNode4, replaceWith);
        assert.equal(result4, testScss3.replace('12px', replaceWith));
        //
        const ast4 = compile(cls + '{' + testScss4 + '}');
        const astNode5 = ast4[0].children[0]; // line 1, column 6
        const result5 = replaceVarValue(testScss4, astNode5, replaceWith);
        assert.equal(result5, testScss4.replace('6px ; ', replaceWith + ';'));
    });
    QUnit.test('ColorValueInput.valueFromInput recognizes common color values', assert => {
        [
            ['#000000',        '#000000ff'],
            ['#000',           '#000000ff'],
            ['#000000bb',      '#000000bb'],
            ['#00000045',      '#00000045'],
            ['rgb(0,0,0,.27)', '#00000045'],
            ['#00000000',      '#00000000'],
            ['red',            '#ff0000ff'],
            [' #00000045 ',    '#00000045'],
            [' red ',          '#ff0000ff'],
            ['foo',            '#000000ff'],
        ].forEach(([input, expected]) => {
            const actual = ColorValueInput.valueFromInput(input);
            assert.deepEqual(actual, {data: expected, type: 'hexa'});
        });
    });
    QUnit.test('LengthValueInput.valueFromInput recognizes common lengths', assert => {
        [
            ['1rem',      {num: '1',   unit: 'rem'}],
            ['1.2rem',    {num: '1.2', unit: 'rem'}],
            ['.2rem',     {num: '.2',  unit: 'rem'}],
            ['1 rem',     {num: '1',   unit: 'rem'}],
            ['1rem ',     {num: '1',   unit: 'rem'}],
            ['1px',       {num: '1',   unit: 'px'}],
            ['1em',       {num: '1',   unit: 'em'}],
            ['1%',        {num: '1',   unit: '%'}],
            ['0rem',      {num: '0',   unit: 'rem'}],
            ['foo',       null],
            ['1',         null],
        ].forEach(([input, expected]) => {
            const actual = LengthValueInput.valueFromInput(input);
            assert.deepEqual(actual, expected);
        });
    });
    QUnit.test('LengthValueInput.valueToString stringifies values', assert => {
        [
            [{num: '1',   unit: 'rem'},  '1rem'],
            [{num: '1.2', unit: 'rem'},  '1.2rem'],
            [{num: '.2',  unit: 'rem'},  '.2rem'],
            [{num: '1',   unit: 'px'},   '1px'],
            [{num: '1',   unit: 'em'},   '1em'],
            [{num: '1',   unit: '%'},    '1%'],
            [{num: '0',   unit: 'rem'},  '0rem'],
        ].forEach(([input, expected]) => {
            const actual = LengthValueInput.valueToString(input);
            assert.deepEqual(actual, expected);
        });
    });
    QUnit.test('OptionValueInput.valueFromInput returns values', assert => {
        const [input, expected] = ['sans-serif', {selected: 'sans-serif'}];
        const actual = OptionValueInput.valueFromInput(input);
        assert.deepEqual(actual, expected);
    });
});
