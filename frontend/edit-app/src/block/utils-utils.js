// ## import blockTreeUtils from '../left-column/block/blockTreeUtils.js';
// ## import store2 from '../store2.js';
// ## 
// ## /**
// ##  * @param {String} blockId
// ##  * @param {'mainTree'|Array<RawBlock>} from
// ##  * @returns {[RawBlock|null, Array<RawBlock>|null, RawBlock|null, RawGlobalBlockTree|Array<RawBlock>|null]}
// ##  */
// ## function findBlockFrom(blockId, from) {
// ##     return blockTreeUtils.findBlockSmart(blockId, from === 'mainTree' ? store2.get().theBlockTree : from);
// ## }
// ## 
// ## /**
// ##  * @param {String} blockId
// ##  * @param {'mainTree'|Array<RawBlock>} from
// ##  * @returns {String|null}
// ##  */
// ## function getIsStoredToTreeIdFrom(blockId, from) {
// ##     return blockTreeUtils.getIsStoredToTreeId(blockId, from === 'mainTree' ? store2.get().theBlockTree : from);
// ## }
// ## 
// ## /**
// ##  * @param {Object} obj
// ##  * @returns {Object}
// ##  */
// ## function cloneDeep(obj) {
// ##     return JSON.parse(JSON.stringify(obj));
// ## }
// ## 
// ## export {findBlockFrom, getIsStoredToTreeIdFrom, cloneDeep};
