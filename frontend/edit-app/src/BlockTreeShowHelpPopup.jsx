import {__} from '@sivujetti-commons-for-edit-app';
import Icon from './commons/Icon.jsx';
import floatingDialog from './FloatingDialog.jsx';

/**
 * @type {preact.FunctionalComponent<Object>}
 */
const BlockTreeShowHelpPopup = () =>
    <div>
        <blockquote class="mb-2 pl-10">{
            __('Sivujetti stores the data of each page to blocks. You can drag them around with a mouse, and todo.')
        }</blockquote>
        <div class="d-flex">
            <div class="col-4"><ul class="block-tree"><li class="page-block ml-0"><div class="d-flex">
                <button class="block-handle columns" type="button"><Icon className="size-xs mr-1" iconId="layout-rows"/>{ __('Colorless') }</button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Ordinary blocks, which don\'t have a background color, are ') }<b>{ __('stored to this page only') }</b>.
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree"><li class="globalBlockTree-block ml-0"><div class="d-flex">
                <button class="block-handle columns" type="button"><Icon className="size-xs mr-1" iconId="layout-rows"/>{ __('Orange') }</button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('A global block (e.g. Header) references to a ') }<b>{ __('separately stored data') }</b>
                { __('. When you edit Header on one page, Headers on other pages changes.') }
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree"><li class="ml-0" data-block-type="PageInfo"><div class="d-flex">
                <button class="block-handle columns" type="button"><Icon className="size-xs mr-1" iconId="file-info"/>{ __('Violet') }</button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Meta blocks contains ') }<b>{ __('additional data / metadata') }</b>{ __(', and otherwise act like ordinary blocks.') }
            </div>
        </div>
        <button
            onClick={ () => floatingDialog.close() }
            class="btn btn-primary mt-8"
            type="button">Ok</button>
    </div>;

export default BlockTreeShowHelpPopup;
