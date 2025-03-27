import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './includes-internal/validation.fi.js';
import sharedStrings from './includes-internal/auth-shared.fi.js';

stringBundles.push({
    'Login': 'Kirjaudu',
    'Forgot password?': 'Unohtuiko salasana?',
}, validationStrings, sharedStrings);
