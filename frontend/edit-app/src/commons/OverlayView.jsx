import {__, env, Icon} from '@sivujetti-commons-for-edit-app';

class OverlayView extends preact.Component {
    /**
     * @access protected
     */
    render({children}) {
        return <div class="scroller">
            <button onClick={ () => env.window.history.back() } class="btn btn-link form-icon p-absolute" title={ __('Close') } type="button">
                <Icon iconId="x" className="size-sm"/>
            </button>
            { children }
        </div>;
    }
}

export default OverlayView;
