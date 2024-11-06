import {completeUrlIfLocal} from '../commons-for-edit-app/styles/scss-utils.js';

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
});
