import {urlUtils} from '@sivujetti-commons-for-edit-app';
import CssStylesValidatorHelper from '../edit-app/src/commons/CssStylesValidatorHelper.js';

QUnit.module('CssStyleValidatorHelper', () => {
    QUnit.test('hoists imports to beginning of input scss', assert => {
        const externalImp1 = '@import "domain.io/font/2";';
        const externalImp2 = '@import \'domain.io/font/1\'  ; ';
        const testInput = `${externalImp1}color:blue;h2{color:red;}${externalImp2}`;
        //
        const compiler = new CssStylesValidatorHelper;
        const [_shouldCommit, result] = compiler.validateAndCompileScss(testInput,
            input => `.foo{${input}}`, '', true);
        assert.equal(result.generatedCss, `${externalImp1}${externalImp2.replace('  ; ', ';')}/* hoisted decls ends */.foo{color:blue;}.foo h2{color:red;}`);
    });

    QUnit.test('hoists and replaces internal font imports', assert => {
        const internalFontImp1 = '@import "/public/uploads/my-font.woff";';
        const internalFontImp2 = '@import \'public/uploads/anoter.woff2?name=Font name&weight=800\';';
        const testInput = `${internalFontImp1}color:blue;h2{color:red;}${internalFontImp2}`;
        //
        const compiler = new CssStylesValidatorHelper;
        const [_shouldCommit, result] = compiler.validateAndCompileScss(testInput,
            input => `.foo{${input}}`, '', true);
        const u = urlUtils.assetBaseUrl;
        const expected1 = `@font-face{font-family:"my font";src:url("${u}public/uploads/my-font.woff") format("woff");font-weight:400;font-style:normal;}`;
        const expected2 = `@font-face{font-family:"Font name";src:url("${u}public/uploads/anoter.woff2?name=Font name&weight=800") format("woff2");font-weight:800;font-style:normal;}`;
        assert.equal(result.generatedCss, `${expected1}${expected2}/* hoisted decls ends */.foo{color:blue;}.foo h2{color:red;}`);
    });

    QUnit.test('completes background urls', assert => {
        const compiler = new CssStylesValidatorHelper;
        //
        for (const [testInput, expected] of [
            ...createTestBackgroundInputs('background'),
            ...createTestBackgroundInputs('background-image')
        ]) {
            const [_shouldCommit, result] = compiler.validateAndCompileScss(testInput,
                input => `.foo{${input}}`, '', true);
            assert.equal(result.generatedCss, `.foo{${expected};}`);
        }
    });
});

function createTestBackgroundInputs(prop) {
    const expectedBase = urlUtils.assetBaseUrl;
    const input1 = `${prop}: url("public/cat.jpg")`;
    const expected1 = `${prop}:url("${expectedBase}public/cat.jpg")`;
    const input2 = `${prop}: linear-gradient(to bottom right, red, lime), url("public/cat.jpg") center center no-repeat`;
    const expected2 = `${prop}:linear-gradient(to bottom right, red, lime),url("${expectedBase}public/cat.jpg") center center no-repeat`;
    //
    return [
        [input1,
        expected1],
        //
        [input1.replace('url(', 'url(  '),
        expected1],
        //
        [input1.replace('public', ''), // background: url("/cat.jpg")
        expected1.replace('public/', '')], // background:url("sivujetti/cat.jpg")
        //
        [input1.replace(/"/g, '\''),
        expected1.replace(/"/g, '\'')],
        //
        [input1.replace(/"/g, ''),
        expected1.replace(/"/g, '')],
        //
        [input2,
        expected2],
        //
        [input2.replace('url(', 'url(  '),
        expected2],
        //
        [input2.replace(/"/g, '\''),
        expected2.replace(/"/g, '\'')],
        //
        [input2.replace(/"/g, ''),
        expected2.replace(/"/g, '')],
        //
        [`${prop}: url("site.com/cat.jpg")`,
        `${prop}:url("site.com/cat.jpg")`],
    ];
}
