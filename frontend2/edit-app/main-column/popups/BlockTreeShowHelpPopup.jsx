import {__, floatingDialog, Icon} from '@sivujetti-commons-for-edit-app';

class BlockTreeShowHelpPopup extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <div>
            <blockquote class="text-prose mt-0 pl-10">{ __('In Sivujetti, the content of pages is presented as a tree structure: each row or branch in the tree corresponds to a section or content of the page. You can ') }<b>{ __('arrange') }</b>{ __(' the different sections of the page by dragging the rows in the content tree. You can ') }<b>{ __('add content') }</b>{ __(' from the rows') }<span style="transform: translate(.2rem, .1rem)" class="p-absolute"><Icon className="mr-0 size-xs" iconId="dots"/></span><span style="margin-left: 1.3rem">{ __('context menus.') }</span></blockquote>
            <div class="d-flex">
                <div class="col-4"><ul class="block-tree no-hover ml-0 mt-0"><li style="border-color:transparent" class="page-block ml-0 pl-0"><div class="d-flex">
                    <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="layout-rows"/>
                    <span class="text-ellipsis">{ __('Colorless') }</span></button>
                    <button class="more-toggle pl-1" type="button" style="opacity: 1;"><Icon iconId="dots" className="size-xs"/></button>
                </div></li></ul></div>
                <div class="col-8 text-prose mt-1 pl-2 ml-2">
                    { __('Regular content, with no colored text, is ') }<b>{ __('stored only to this page') }</b>.
                </div>
            </div>
            <div class="d-flex mt-2 pt-2">
                <div class="col-4"><ul class="block-tree no-hover ml-0 mt-0"><li style="border-color:transparent" class="globalBlockTree-block ml-0 pl-0"><div class="d-flex">
                    <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="layout-rows"/>
                    <span class="text-ellipsis">{ __('Orange') }</span></button>
                </div></li></ul></div>
                <div class="col-8 text-prose mt-1 pl-2 ml-2">
                    { __('Unique content refers to ') }<b>{ __('separately stored data') }</b>
                    { __('. When you edit unique content on one page, the information changes in all corresponding content across pages.') }
                </div>
            </div>
            <div class="d-flex mt-2 pt-2">
                <div class="col-4"><ul class="block-tree no-hover ml-0 mt-0"><li style="border-color:transparent" class="ml-0 pl-0" data-block-type="PageInfo"><div class="d-flex">
                    <button class="block-handle" type="button"><Icon className="size-xs p-absolute" iconId="file-info"/>
                    <span class="text-ellipsis">{ __('Violet') }</span></button>
                </div></li></ul></div>
                <div class="col-8 text-prose mt-1 pl-2 ml-2">
                    { __('Meta content contains ') }<b>{ __('additional data / metadata') }</b>.
                </div>
            </div>
            <button
                onClick={ () => floatingDialog.close() }
                class="btn btn-primary mt-8"
                type="button">Ok</button>
        </div>;
    }
}

export default BlockTreeShowHelpPopup;
