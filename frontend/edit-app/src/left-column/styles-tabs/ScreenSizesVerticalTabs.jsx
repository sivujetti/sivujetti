import {__, Icon} from '@sivujetti-commons-for-edit-app';

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
                    title={ __('Larget screens (<= 960px)') }>
                    <span class="color-dimmed3">*</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(1) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 1 ? '' : ' current'}` }
                    title={ __('Large screens (<= 960px)') }>
                    <span class="color-dimmed3">L</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(2) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 2 ? '' : ' current'}` }
                    title={ __('Medium-sized screens (<= 840px)') }>
                    <span class="color-dimmed3">M</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(3) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 3 ? '' : ' current'}` }
                    title={ __('Small screens (<= 600px)') }>
                    <span class="color-dimmed3">S</span>
                </button>
                <button
                    onClick={ () => setCurTabIdx(4) }
                    class={ `btn btn-link text-tiny${curTabIdx !== 4 ? '' : ' current'}` }
                    title={ __('Extra small screens (<= 480px)') }>
                    <span class="color-dimmed3">Xs</span>
                </button>
                <button onClick={ () => alert('Foo') } class="btn btn-link" title={ __('What\'re these?') }>
                    <Icon iconId="info-circle" className="size-xxs"/>
                </button>
            </div>
            <div class="vert-tab-content mb-1">
                { children }
            </div>
        </div>;
    }
}

export default ScreenSizesVerticalTabs;
