import {__, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';

/**
 * @type {preact.FunctionalComponent<Object>}
 */
const BlockTreeShowHelpPopup = () =>
    <div>
        <blockquote class="pl-10" style="line-height: 1.1rem;margin-top: 0px;">{ __('In Sivujetti, the content of pages is presented as a tree structure: each row or branch in the tree corresponds to a section or content of the page. You can ') }<b>{ __('arrange') }</b>{ __(' the different sections of the page by dragging the rows in the content tree. You can start ') }<b>{ __('adding content') }</b>{ __(' using the') }<span style="transform: scale(.8) translate(0px,-3px);" class="p-absolute"><button class="btn btn-primary btn-sm p-0 with-icon" type="button" style="border-top-left-radius: 0; border-bottom-left-radius: 0; cursor: default;"><Icon className="mr-0 size-xs" iconId="chevron-right"/></button></span><span style="margin-left: 1rem">{ __('button') }</span>{ __(' on the left side of the page.') }</blockquote>
        <div class="d-flex">
            <div class="col-4"><ul class="block-tree ml-0 mt-0"><li style="border-color:transparent" class="page-block ml-0 pl-0"><div class="d-flex">
                <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="layout-rows"/>
                <span class="text-ellipsis">{ __('Colorless') }</span></button>
                <button class="more-toggle ml-2" type="button" style="opacity: 1;"><Icon iconId="dots" className="size-xs"/></button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Regular content, with no colored text, is ') }<b>{ __('stored only to this page') }</b>.
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree ml-0 mt-0"><li style="border-color:transparent" class="globalBlockTree-block ml-0 pl-0"><div class="d-flex">
                <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="layout-rows"/>
                <span class="text-ellipsis">{ __('Orange') }</span></button>
            </div></li></ul></div>
            <div class="col-8 mt-1 pl-2 ml-2">
                { __('Unique content refers to ') }<b>{ __('separately stored data') }</b>
                { __('. When you edit unique content on one page, the information changes in all corresponding content across pages.') }
            </div>
        </div>
        <div class="d-flex mt-2 pt-2">
            <div class="col-4"><ul class="block-tree ml-0 mt-0"><li style="border-color:transparent" class="ml-0 pl-0" data-block-type="PageInfo"><div class="d-flex">
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
