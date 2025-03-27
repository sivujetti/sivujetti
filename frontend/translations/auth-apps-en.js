import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './includes-internal/validation.en.js';
import sharedStrings from './includes-internal/auth-shared.en.js';

stringBundles.push({
    'Login': 'Login',
    'Forgot password?': 'Forgot password?',
}, validationStrings, sharedStrings);
