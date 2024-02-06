import {currentInstance as floatingDialog} from './FloatingDialog.jsx';
import {__, Icon, mediaScopes} from './internal-wrapper.js';
import ScreenSizesTabShowHelpPopup from './popups/ScreenSizesTabShowHelpPopup.jsx';

class ScreenSizesVerticalTabs extends preact.Component {
    /**
     * @param {{curTabIdx: Number; setCurTabIdx: (newIdx: Number): void;}} props
     */
    render({children, curTabIdx, setCurTabIdx}) {
        return <div class="vert-tabs mx-1">
            <div class="vert-tab-btns">
                <button
                    onClick={ () => setCurTabIdx(0) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 0 ? '' : ' current'}` }
                    title={ `${__('All sizes')} (${__('Desktops').toLowerCase()} / ${__('laptops')})` }>
                    <span class="color-dimmed3">*</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(1) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 1 ? '' : ' current'}` }
                    title={ `${__('%s or smaller', '960px')} (${__('Tablets').toLowerCase()})` }>
                    <span class="color-dimmed3">L</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(2) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 2 ? '' : ' current'}` }
                    title={ `${__('%s or smaller', '840px')} (${__('Small tablets').toLowerCase()})` }>
                    <span class="color-dimmed3">M</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(3) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 3 ? '' : ' current'}` }
                    title={ `${__('%s or smaller', '600px')} (${__('Phones').toLowerCase()}})` }>
                    <span class="color-dimmed3">S</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(4) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 4 ? '' : ' current'}` }
                    title={ `${__('%s or smaller', '480px')} (${__('Small phones').toLowerCase()})` }>
                    <span class="color-dimmed3">Xs</span>
                </button>
                <button onClick={ () => floatingDialog.open(ScreenSizesTabShowHelpPopup, {
                        title: __('Screen sizes'),
                    }, {}) }
                    class="btn btn-link"
                    title={ __('What\'re these?') }>
                    <Icon iconId="info-circle" className="size-xxs"/>
                </button>
            </div>
            <div class="vert-tab-content mb-1">
                { children }
            </div>
        </div>;
    }
}

/**
 * @param {Array<any>} itemsToShow
 * @param {AbstractStylesList} cmp
 * @returns {Array<Number>}
 */
ScreenSizesVerticalTabs.createTabIdxes = (itemsToShow, cmp) => {
    const curCurTabIdxes = cmp.state.curTabIdxs || [];
    return itemsToShow.map((_, i) => curCurTabIdxes[i] || 0);
};

/**
 * @param {Array<Number>} curTabIdxs
 * @param {Number} nthItemToUpdate i.e. listItemIdx
 * @param {Boolean} to
 * @returns {{curTabIdxs: Array<Number>;}} New state portion
 */
ScreenSizesVerticalTabs.createTabIdxesWithNewCurrentIdx = (curTabIdxs, nthItemToUpdate, to) => {
    return {curTabIdxs: curTabIdxs.map((idx, i2) => i2 !== nthItemToUpdate ? idx : to)};
};

export default ScreenSizesVerticalTabs;
