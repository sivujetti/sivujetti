// ## class Translator {
// ##     /**
// ##      * @param {{[key: string]: string;}?} strings
// ##      */
// ##     constructor(strings) {
// ##         this.strings = strings || {};
// ##     }
// ##     /**
// ##      * @param {{[key: string]: string;}} strings
// ##      * @access public
// ##      */
// ##     addStrings(strings) {
// ##         Object.assign(this.strings, strings);
// ##     }
// ##     /**
// ##      * @param {string} key
// ##      * @param {any[]} args
// ##      * @returns {string}
// ##      */
// ##     t(key, ...args) {
// ##         const tmpl = this.strings[key];
// ##         return tmpl ? !args ? tmpl : format(tmpl, ...args) : key;
// ##     }
// ## }
// ## 
// ## function format(tmpl, ...args) {
// ##     const regex = /(?:^|[^\\])%([a-z])/gi;
// ##     let i = -1;
// ##     let match, replacement;
// ##     while ((match = regex.exec(tmpl)) && (replacement = args[++i]))
// ##         tmpl = tmpl.replace(`%${match[1]}`, replacement);
// ##     return tmpl;
// ## }
// ## 
// ## export default Translator;
