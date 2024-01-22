import {__, Icon} from '../../sivujetti-commons-unified.js';

class OverlayView extends preact.Component {
    /**
     * @access protected
     */
    render({children}) {
        return <div class="scroller">
            <button onClick={ () => preactRouter.route('/') } class="btn btn-link form-icon p-absolute" title={ __('Close') } type="button">
                <Icon iconId="x" className="size-sm"/>
            </button>
            { children }
        </div>;
    }
}

export default OverlayView;
