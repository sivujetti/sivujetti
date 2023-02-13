const CHILDREN_START = ' children-start ';
const CHILDREN_END = ' children-end ';
const CHILD_CONTENT_PLACEHOLDER = '<!-- children-placeholder -->';

const HAS_ERRORS = 1 << 1;
const NO_OP_QUEUE_EMIT = 1 << 2;

function noop() {
    //
}

const DONT_KNOW_YET = 'don\'t-know-yet';

export {CHILDREN_START, CHILD_CONTENT_PLACEHOLDER, CHILDREN_END, noop,
        HAS_ERRORS, NO_OP_QUEUE_EMIT, DONT_KNOW_YET};
