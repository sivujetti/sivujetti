import {blockTreeUtils, writeBlockProps} from '@sivujetti-commons-for-edit-app';
import SaveButton from '../edit-app/menu-column/SaveButton.jsx';

QUnit.module('SaveButton.jsx', () => {
    QUnit.test('pushOp strips "is-throttled" items', assert => {
        const saveButton = new SaveButton();

        const initialState = createTestTheBlockTreeState('Lorem ipsum');
        saveButton.initChannel('theBlockTree', initialState);
        const userCtx = {event: 'update-single-block-prop', blockId: initialState[0].id};

        const finalNonThrottled = simulateThrottledTyping(initialState, userCtx, saveButton);

        assert.equal(saveButton.states['theBlockTree'].length, 2, 'Should clear throttled items');
        assert.deepEqual(saveButton.states['theBlockTree'].at(-1), finalNonThrottled, 'Should only pick latest item');
        assert.deepEqual(saveButton.states['theBlockTree'].at(-2), initialState);
    });
    function simulateThrottledTyping(initialState, userCtx, saveButton) {
        const throttled1 = blockTreeUtils.createMutation(initialState, copy => {
            writeBlockProps(copy[0], {html: 'Lorem ipsum,'});
        });
        saveButton.pushOp('theBlockTree', throttled1, {...userCtx}, 'is-throttled');

        const throttled2 = blockTreeUtils.createMutation(throttled1, copy => {
            writeBlockProps(copy[0], {html: 'Lorem ipsum, d'});
        });
        saveButton.pushOp('theBlockTree', throttled2, {...userCtx}, 'is-throttled');

        const throttled3 = blockTreeUtils.createMutation(throttled2, copy => {
            writeBlockProps(copy[0], {html: 'Lorem ipsum, do'});
        });
        saveButton.pushOp('theBlockTree', throttled3, {...userCtx}, 'is-throttled');

        const finalNonThrottled = blockTreeUtils.createMutation(throttled3, copy => {
            writeBlockProps(copy[0], {html: 'Lorem ipsum, do.'});
        });
        saveButton.pushOp('theBlockTree', finalNonThrottled, {...userCtx}, null);

        return finalNonThrottled;
    }
});

function createTestTheBlockTreeState(text) {
    return [{
            "type": "Text",
            "title": "",
            "renderer": "jsx",
            "id": "ukF8haY0mNj",
            "propsData": [{"key": "html", "value": text}],
            "styleClasses": "",
            "children": [],
            "html": text
        }
    ];
}
