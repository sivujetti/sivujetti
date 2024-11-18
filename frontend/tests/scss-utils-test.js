import scssUtils, {completeUrlIfLocal} from '../commons-for-edit-app/styles/scss-utils.js';

QUnit.module('scss-utils.js', () => {
    QUnit.test('completeUrlIfLocal() completes local urls', assert => {
        assert.equal(completeUrlIfLocal('public/img.png', ''), '/public/img.png');
        assert.equal(completeUrlIfLocal('/public/img.png', ''), '/public/img.png');
        assert.equal(completeUrlIfLocal('uploads/img.png', ''), '/public/uploads/img.png');
        assert.equal(completeUrlIfLocal('/uploads/img.png', ''), '/public/uploads/img.png');
        assert.equal(completeUrlIfLocal('/foo/img.png', ''), '/foo/img.png');
        assert.equal(completeUrlIfLocal('foo.com/img.png', ''), null);
        assert.equal(completeUrlIfLocal('https://foo.com/img.png', ''), null);
        assert.equal(completeUrlIfLocal('//foo.com/img.png', ''), null);
    });
    QUnit.test('scssUtils.extractImports() recognizes url with multiple families', assert => {
        const urlWithTwoFamilies = 'https://domain.io/css2?family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Montserrat:ital@0;1&display=swap';
        const externalImp1 = `@import url('${urlWithTwoFamilies}')  ; `;
        const externalImp2 = `@import url("${urlWithTwoFamilies}");`;
        const externalImp3 = `@import '${urlWithTwoFamilies}'  ; `;
        const externalImp4 = `@import "${urlWithTwoFamilies}";`;
        const testInput = `.foo{${externalImp1}${externalImp2}${externalImp3}\ncolor:blue;\n${externalImp4}}`;
        console.log('test',testInput);
        //
        const uu = scssUtils.extractImports(testInput);
        const {externals, locals} = uu;
        assert.equal(externals.length, 8);
        assert.equal(locals.length, 0);
        assert.equal(externals[0].fontFamily, 'Josefin Sans');
        assert.equal(externals[1].fontFamily, 'Montserrat');
    });
});
