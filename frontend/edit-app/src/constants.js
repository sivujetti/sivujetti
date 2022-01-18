const validationConstraints = Object.freeze({
    HARD_SHORT_TEXT_MAX_LEN: 1024,
    HARD_LONG_TEXT_MAX_LEN: 128000,
});

const sensibleDefaults = Object.freeze({
    normalTypingDebounceMillis: 400,
});

export {validationConstraints, sensibleDefaults};
