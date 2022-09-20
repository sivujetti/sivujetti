const validationConstraints = Object.freeze({
    HARD_SHORT_TEXT_MAX_LEN: 1024,
    HARD_LONG_TEXT_MAX_LEN: 128000,
    INDEX_STR_MAX_LENGTH: 92,
    SLUG_REGEXP: '^/[a-zA-Z0-9_-]*$',
});

const sensibleDefaults = Object.freeze({
    normalTypingDebounceMillis: 400,
});

export {validationConstraints, sensibleDefaults};
