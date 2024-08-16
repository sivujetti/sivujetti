import {generateShortId, shortIdToComponents, reset} from '../commons-for-edit-app/short-id-gen.js';

QUnit.module('short-id-gen.js', () => {
    QUnit.test('generateShortId generates unique ids', assert => {
        const $t1 = Date.now();
        const $t2 = $t1 + 1001;
        const $t3 = $t1 + 2002;
        const $t4 = 14201568000000; // strtotime("12 january 2420") * 1000;
        const $t5 = $t4 + 1;
        const $id1 = generateShortId($t1);
        const $id2 = generateShortId($t2);
        const $id3 = generateShortId($t3);
        const $id4 = generateShortId($t4);
        const $id5 = generateShortId($t5);

        const $c1 = shortIdToComponents($id1);
        const $c2 = shortIdToComponents($id2);
        const $c3 = shortIdToComponents($id3);
        const $c4 = shortIdToComponents($id4);
        const $c5 = shortIdToComponents($id5);

        assert.equal($c1.timestampWithMillis, $t1);
        assert.equal($c2.timestampWithMillis, $t2);
        assert.equal($c3.timestampWithMillis, $t3);
        assert.equal($c4.timestampWithMillis, $t4);
        assert.equal($c5.timestampWithMillis, $t5);

        assert.equal($c1.randomPart.length, 4);
        assert.equal($c2.randomPart.length, 4);
        assert.equal($c3.randomPart.length, 4);
        assert.equal($c4.randomPart.length, 4);
        assert.equal($c5.randomPart.length, 4);

        const $onlyEncodedTimePart = $id4.slice(0, -4);
        assert.equal($onlyEncodedTimePart, '421E82T6');

        reset();
    });
    QUnit.test('generateShortId increments millisecond', assert => {
        const $t = Date.now();
        const $id1 = generateShortId($t);
        const $id2 = generateShortId($t);

        assert.notEqual($id1, $id2);
        const $c1 = shortIdToComponents($id1);
        const $c2 = shortIdToComponents($id2);
        assert.equal($c1.timestampWithMillis, $t);
        assert.equal($c2.timestampWithMillis, $t + 1);

        reset();
    });
    QUnit.test('generateShortId never uses same millisecond', assert => {
        const $t = Date.now();
        // Batch/call #1
        const _$id1 = generateShortId($t); // $t
        const _$id2 = generateShortId($t); // $t + 1
        const _$id3 = generateShortId($t); // $t + 2

        // Batch/call #2
        const $t2 = $t + 1;
        const $id4 = generateShortId($t2); // Should be $t + 3, not $t + 1
        const $id5 = generateShortId($t2); // Should be $t + 4, not $t + 2

        const $c4 = shortIdToComponents($id4);
        const $c5 = shortIdToComponents($id5);
        assert.equal($c4.timestampWithMillis, $t + 3);
        assert.equal($c5.timestampWithMillis, $t + 4);
    });
});
