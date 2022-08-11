import {__, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';

/**
 * @type {preact.FunctionalComponent<Object>}
 */
const BlockTreeShowHelpPopup = () =>
    <div>
        <blockquote class="pl-10" style="line-height: 1.1rem;margin-top: 0px;">{ __('todo1') }<b>{ __('todo2') }</b>{ __('todo3') }<b>{ __('todo4') }</b> <span style="transform: scale(.8) translate(0px,-3px);" class="p-absolute"><button class="btn btn-primary btn-sm p-0 with-icon" type="button" style="border-top-left-radius: 0; border-bottom-left-radius: 0; cursor: default;"><Icon className="mr-0 size-xs" iconId="chevron-right"/></button></span><span style="margin-left: 1rem">{ __('todo5') }</span>{ __('todo6') }</blockquote>
        <div class="d-flex">
            <div class="col-4"><ul class="block-tree"><li class="page-block ml-0 pl-0"><div class="d-flex">
                <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="layout-rows"/>
                <span class="text-ellipsis">{ __('Colorless') }</span></button>
                <button class="more-toggle ml-2" type="button" style="opacity: 1;"><Icon iconId="dots" className="size-xs"/></button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Ordinary content, which don\'t have a background color, are ') }<b>{ __('stored to this page only') }</b>.
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree"><li class="globalBlockTree-block ml-0 pl-0"><div class="d-flex">
                <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="layout-rows"/>
                <span class="text-ellipsis">{ __('Orange') }</span></button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Global content (e.g. Header) references to a ') }<b>{ __('separately stored data') }</b>
                { __('. When you edit Header on one page, Headers on other pages changes.') }
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree"><li class="ml-0 pl-0" data-block-type="PageInfo"><div class="d-flex">
                <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="file-info"/>
                <span class="text-ellipsis">{ __('Violet') }</span></button>
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
