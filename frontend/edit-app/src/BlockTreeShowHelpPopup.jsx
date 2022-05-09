import {__, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';

/**
 * @type {preact.FunctionalComponent<Object>}
 */
const BlockTreeShowHelpPopup = () =>
    <div>
        <blockquote class="pl-10" style="line-height: 1rem;margin-top: 0;">{ __('todo.') }</blockquote>
        <div class="d-flex">
            <div class="col-4"><ul class="block-tree"><li class="page-block ml-0"><div class="d-flex">
                <button class="block-handle columns" type="button"><Icon className="size-xs mr-1" iconId="layout-rows"/>{ __('Colorless') }</button>
                <button class="more-toggle ml-2" type="button" style="opacity: 1;"><Icon iconId="dots" className="size-xs"/></button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Ordinary content, which don\'t have a background color, are ') }<b>{ __('stored to this page only') }</b>.
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree"><li class="globalBlockTree-block ml-0"><div class="d-flex">
                <button class="block-handle columns" type="button"><Icon className="size-xs mr-1" iconId="layout-rows"/>{ __('Orange') }</button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Global content (e.g. Header) references to a ') }<b>{ __('separately stored data') }</b>
                { __('. When you edit Header on one page, Headers on other pages changes.') }
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree"><li class="ml-0" data-block-type="PageInfo"><div class="d-flex">
                <button class="block-handle columns" type="button"><Icon className="size-xs mr-1" iconId="file-info"/>{ __('Violet') }</button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Meta content contains ') }<b>{ __('additional data / metadata') }</b>{ __(', and otherwise act like ordinary content.') }
            </div>
        </div>
        <button
            onClick={ () => floatingDialog.close() }
            class="btn btn-primary mt-8"
            type="button">Ok</button>
    </div>;

export default BlockTreeShowHelpPopup;
