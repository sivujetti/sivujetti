import {__, api, env, http} from '@sivujetti-commons-for-edit-app';
import store, {pushItemToOpQueue} from '../../store.js';
import store2 from '../../store2.js';
import {createUnitClass, findBlockTypeStyles} from './styles-tabs-common.js';

/**
 * @param {String} blockTypeName
 * @param {() => void} doUndo
 * @param {ThemeStyleUnit} removedRemote = null
 * @param {String} removedRemoteBlockTypeName = null
 */
function emitCommitStylesOp(blockTypeName, doUndo, removedRemote = null, removedRemoteBlockTypeName = null) {
    const url = `/api/themes/${api.getActiveTheme().id}/styles/scope-block-type/${blockTypeName}`;
    store.dispatch(pushItemToOpQueue(`upsert-theme-style#${url}`, {
        doHandle: () => {
            const style = findBlockTypeStyles(store2.get().themeStyles, blockTypeName);
            const remoteStyle = removedRemote ? getRemoteStyleIfRemoved(style.units, removedRemote.id, removedRemoteBlockTypeName) : null;
            const data = {
                ...{units: style.units},
                ...(!remoteStyle ? {} : {connectedUnits: remoteStyle.units, connectedUnitsBlockTypeName: removedRemoteBlockTypeName})
            };
            return http.put(url, data)
                .then(resp => {
                    if (resp.ok !== 'ok') throw new Error('-');
                    return true;
                })
                .catch(err => {
                    env.window.console.error(err);
                    return true;
                });
        },
        doUndo,
        args: [],
    }));
}

/**
 * @param {Array<ThemeStyleUnit>} bodyUnits
 * @param {String} removedUnitId
 * @param {String} removedUnitBlockTypeName
 */
function getRemoteStyleIfRemoved(bodyUnits, removedUnitId, removedUnitBlockTypeName) {
    const lookFor = createUnitClass(removedUnitId, removedUnitBlockTypeName);
    // Normal case: $lookFor is _not_ found from $bodyUnits
    if (!bodyUnits.some(({id}) => id === lookFor))
        return findBlockTypeStyles(store2.get().themeStyles, removedUnitBlockTypeName);
    return null;
}

export {emitCommitStylesOp};