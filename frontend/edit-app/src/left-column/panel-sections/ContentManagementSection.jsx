// ## import {__, api, Icon, MenuSection} from '@sivujetti-commons-for-edit-app';
// ## 
// ## class ContentManagementSection extends preact.Component {
// ##     // userCanCreatePageTypes;
// ##     // userCanListUploads;
// ##     /**
// ##      * @param {{[key: String]: any;}} props
// ##      */
// ##     constructor(props) {
// ##         super(props);
// ##         this.userCanCreatePageTypes = api.user.can('createPageTypes');
// ##         this.userCanListUploads = api.user.can('listUploads');
// ##     }
// ##     /**
// ##      * @access protected
// ##      */
// ##     render() {
// ##         return <MenuSection
// ##             title={ __('Content management') }
// ##             subtitle={ `${__('Pages')}, ${__('Files').toLowerCase()}` }
// ##             iconId="database"
// ##             outerClass="content-management"
// ##             colorClass="color-orange">
// ##             <nav>
// ##                 <a href="#/pages" class="with-icon">
// ##                     <Icon iconId="file-text" className="size-sm color-orange color-saturated"/>
// ##                     <span class="color-dimmed">{ __('Pages') }</span>
// ##                 </a>
// ##                 <a href="#/pages/create" class="with-icon">
// ##                     <Icon iconId="circle-plus" className="size-sm color-orange color-saturated"/>
// ##                     <span class="color-dimmed">{ __('Create %s', __('page')) }</span>
// ##                 </a>
// ##                 { this.userCanListUploads ? <a href="#/uploads" class="with-icon">
// ##                     <Icon iconId="files" className="size-sm color-orange color-saturated"/>
// ##                     <span class="color-dimmed">{ __('Files') }</span>
// ##                 </a> : null }
// ##                 { this.userCanCreatePageTypes ? <a href="#/page-types/create" class="with-icon">
// ##                     <Icon iconId="circle-plus" className="size-sm color-orange color-saturated"/>
// ##                     <span class="color-dimmed">{ __('Create %s', __('page type')) }</span>
// ##                 </a> : null }
// ##             </nav>
// ##         </MenuSection>;
// ##     }
// ## }
// ## 
// ## export default ContentManagementSection;
