import {currentInstance as floatingDialog} from '../FloatingDialog.jsx';
import {__} from '../edit-app-singletons.js';
import {Icon} from '../Icon.jsx';

class ScreenSizesTabShowHelpPopup extends preact.Component {
    render() {
        return <div>
            <div class="with-icon py-1 mb-2">
                <span><Icon iconId="info-circle" className="size-sm color-dimmed3"/></span>
                { __('You can define styles separately for different screen widths according to the following table. You can preview the styles by resizing the browser window.') }
            </div>
            <table class="table table-striped">
                <thead><tr>
                    <th>{ __('Width') }</th>
                    <th>{ __('Affects when screen is') }</th>
                    <th>{ __('Examples') }</th>
                </tr></thead>
                <tbody>
                    <tr>
                        <td><b>*</b></td>
                        <td>{ __('All sizes') }</td>
                        <td>{ `${__('Desktops')}, ${__('laptops')}` }</td>
                    </tr>
                    <tr>
                        <td><b>L</b></td>
                        <td>{ __('%s or smaller', '960px (10″)') }</td>
                        <td>{ __('Tablets') }</td>
                    </tr>
                    <tr>
                        <td><b>M</b></td>
                        <td>{ __('%s or smaller', '840px (8.75″)') }</td>
                        <td>{ __('Small tablets') }</td>
                    </tr>
                    <tr>
                        <td><b>S</b></td>
                        <td>{ __('%s or smaller', '600px (6.25″)') }</td>
                        <td>{ __('Phones') }</td>
                    </tr>
                    <tr>
                        <td><b>Xs</b></td>
                        <td>{ __('%s or smaller', '480px (5″)') }</td>
                        <td>{ __('Small phones') }</td>
                    </tr>
                </tbody>
            </table>
            <button
                onClick={ () => floatingDialog.close() }
                class="btn btn-primary mt-8"
                type="button">Ok</button>
        </div>;
    }
}

export default ScreenSizesTabShowHelpPopup;
