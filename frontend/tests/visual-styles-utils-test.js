import VisualStyles from '../edit-app/src/Block/VisualStyles.jsx';
const {compile} = window.stylis;

QUnit.module('VisualStyles.jsx', () => {
    QUnit.test('replaceVarValue replaces css variable value by column and line', assert => {
        const subject = new VisualStyles;
        const testScss = ['// line 1', '--fontSize: 1.4rem;'].join('\n');
        const testScss2 = ['// line 1', '--fontSize: 1.4rem; --another: .8;'].join('\n');
        const testScss3 = ['--fontSize: 12px;'].join('\n');
        const testScss4 = ['--fontSize: 6px ; '].join('\n');
        const replaceWith = '2.5rem';
        const cls = '.j-Heading';
        //
        const ast = compile(cls + '{' + testScss + '}');
        const astNode = ast[0].children[1]; // line 2, column 20
        const result = subject.replaceVarValue(testScss, astNode, replaceWith);
        assert.equal(result, testScss.replace('1.4rem', replaceWith));
        //
        const ast2 = compile(cls + '{' + testScss2 + '}');
        const astNode2 = ast2[0].children[2]; // line 2, column 35
        const result2 = subject.replaceVarValue(testScss2, astNode2, replaceWith);
        assert.equal(result2, testScss2.replace('.8', replaceWith));
        //
        const astNode3 = ast2[0].children[1]; // line 2, column 20
        const result3 = subject.replaceVarValue(testScss2, astNode3, replaceWith);
        assert.equal(result3, testScss2.replace('1.4rem', replaceWith));
        //
        const ast3 = compile(cls + '{' + testScss3 + '}');
        const astNode4 = ast3[0].children[0]; // line 1, column 23
        const result4 = subject.replaceVarValue(testScss3, astNode4, replaceWith);
        assert.equal(result4, testScss3.replace('12px', replaceWith));
        //
        const ast4 = compile(cls + '{' + testScss4 + '}');
        const astNode5 = ast4[0].children[0]; // line 1, column 6
        const result5 = subject.replaceVarValue(testScss4, astNode5, replaceWith);
        assert.equal(result5, testScss4.replace('6px ; ', replaceWith + ';'));
    });
});
