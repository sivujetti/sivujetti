import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './include-internal/validation.en.js';

stringBundles.push({
    'Page': 'Page',
    'Services': 'Services',
    'Services#partitive': 'Services',
    'Service': 'Service',
    // edit-app/src/Page/PageCreateMainPanelView.jsx
    'Create %s': 'Create %s',
    'Cancel add %s': 'Cancel add %s',
    'Back': 'Back',
    'Layout': 'Layout',
    'Add to menu': 'Add to menu',
    'Title': 'Title',
    'Slug': 'Slug',
    'Content': 'Content',
    'Page "%s" already exist.': 'Page "%s" already exist.',
    'Something unexpected happened.': 'Something unexpected happened.',
    // edit-app/src/BlockEditForm.jsx
    'Own styles': 'Own styles',
    'Base styles': 'Base styles',
    'Use specializations': 'Use specializations',
    'If on, any changes made to this\nglobal content tree won\'t affect\nthe original': 'If on, any changes made to this\nglobal content tree won\'t affect\nthe original',
    'Styles must contain at least one CSS-rule': 'Styles must contain at least one CSS-rule',
    // edit-app/src/BlockTree.jsx
    'Add child content': 'Add child content',
    'Clone': 'Clone',
    'Clone content': 'Clone content',
    'Delete': 'Delete',
    'Delete content': 'Delete content',
    'Convert to global': 'Convert to global',
    'Convert to global content': 'Convert to global content',
    'Content tree': 'Content tree', // ctrl + f 'Block tree'
    // edit-app/src/BlockTrees.jsx
    'Add content to this page': 'Add content to this page',
    // edit-app/src/BlockTreeShowHelopPopup.jsx
    'todo.': 'todo.',
    'Colorless': 'Colorless',
    'Ordinary content, which don\'t have a background color, are ': 'Ordinary content, which don\'t have a background color, are ',
    'stored to this page only': 'stored to this page only',
    'Orange': 'Orange',
    'Global content (e.g. Header) references to a ': 'Global content (e.g. Header) references to a ',
    'separately stored data': 'separately stored data',
    '. When you edit Header on one page, Headers on other pages changes.': '. When you edit Header on one page, Headers on other pages changes.',
    'Violet': 'Violet',
    'Meta content contains ': 'Meta content contains ',
    'additional data / metadata': 'additional data / metadata',
    ', and otherwise act like ordinary content.': ', and otherwise act like ordinary content.',
    // edit-app/src/BlockTypeBaseStylesTab.jsx
    'These styles will affect all %s content': 'These styles will affect all %s content',
    // edit-app/src/BlockTypeSelector.jsx
    'Common': 'Common',
    'Globals': 'Globals',
    'Cancel': 'Cancel',
    // edit-app/src/ConvertBlockToGlobalBlockTreeDialog.jsx
    'Store this content globally so you can use it later in other pages?': 'Store this content globally so you can use it later in other pages?',
    'Name': 'Name',
    'e.g. Header, Footer': 'e.g. Header, Footer',
    'Convert': 'Convert',
    // edit-app/src/DefaultView/GlobalStylesSection.jsx
    'Styles': 'Styles',
    // edit-app/src/DefaultView/OnThisPageSection.jsx
    'On this page': 'On this page',
    // edit-app/src/DefaultView/WebsiteSection.jsx
    'Website': 'Website',
    // edit-app/src/PageType/PageTypeCreateMainPanelView.jsx
    'page type': 'page type',
    'Default content': 'Default content',
    'Settings': 'Settings',
    'Fields': 'Fields',
    // edit-app/src/DefaultMainPanelView.jsx
    'My website': 'My website',
    'Pages': 'Pages',
    'Pages#partitive': 'Pages',
    'page': 'page',
    'Global styles': 'Global styles',
    // edit-app/src/EditApp.jsx
    'Edit mode': 'Edit mode',
    'Exit edit mode': 'Exit edit mode',
    'Go to dashboard': 'Go to dashboard',
    'Log out': 'Log out',
    'Created new %s': 'Created new %s',
    'Page title': 'Page title',
    // edit-app/src/GlobalBlockTreeSelector.jsx
    'No %s found': 'No %s found',
    'global content': 'global content',
    // edit-app/src/IndividualBlockStylesTab.jsx
    'These styles will affect this individual content only': 'These styles will affect this individual content only',
    // edit-app/src/InspectorPanel.jsx
    'Close': 'Close',
    // edit-app/src/PageType/PageTypeBasicInfoConfigurationForm.jsx
    'Name (for computers)': 'Name (for computers)',
    'Name (plural)': 'Name (plural)',
    'Description': 'Description',
    'Listable': 'Listable',
    'Default layout': 'Default layout',
    // edit-app/src/SaveButton.jsx
    'Save changes': 'Save changes',
    // edit-app/src/block-types/Menu/EditForm.jsx
    'Add link': 'Add link',
    'Edit': 'Edit',
    'Edit link': 'Edit link',
    'Delete link': 'Delete link',
    // edit-app/src/block-types/Menu/EditItemPanel.jsx
    'Link text': 'Link text',
    'Url': 'Url',
    'e.g. %s or %s': 'e.g. %s or %s',
    // edit-app/src/block-types/Menu/menu.js
    'Menu': 'Menu',
    'Home': 'Home',
    'About': 'About',
    // edit-app/src/block-types/button.js
    'Button': 'Button',
    'Link element': 'Link element',
    'Normal button': 'Normal button',
    'Submit button': 'Submit button',
    'Link': 'Link',
    'Css classes': 'Css classes',
    'Tag type': 'Tag type',
    'Button text': 'Button text',
    // edit-app/src/block-types/columns.js
    'Columns': 'Columns',
    'Num columns': 'Num columns',
    'Full width': 'Full width',
    // edit-app/src/block-types/heading.js
    'Heading': 'Heading',
    'Level': 'Level',
    'Add content after': 'Add content after',
    'Heading text': 'Heading text',
    // edit-app/src/block-types/image.js
    'Image': 'Image',
    // edit-app/src/block-types/listing.js
    'Listing': 'Listing',
    'List': 'List',
    'at most': 'at most',
    'all': 'all',
    'single': 'single',
    'Type amount': 'Type amount',
    '%s %s starts with': '%s %s starts with',
    'whose': 'whose',
    'which': 'which',
    'blog': 'blog',
    'and': 'and',
    'ordered by': 'ordered by',
    'newest to oldest': 'newest to oldest',
    'oldest to newest': 'oldest to newest',
    'randomly': 'randomly',
    'rendering %s using template': 'rendering %s using template',
    'it': 'it',
    'them': 'them',
    'Add new %s': 'Add new %s',
    '%s must be a number': '%s must be a number',
    'This value': 'This value',
    // edit-app/src/block-types/pageInfo.js
    'PageInfo': 'Metadata',
    'Url (slug)': 'Url (slug)',
    'Meta description': 'Meta description',
    // edit-app/src/block-types/paragraph.js
    'Paragraph': 'Paragraph',
    'Text': 'Text',
    'Paragraph text': 'Paragraph text',
    // edit-app/src/block-types/richText.js
    'RichText': 'Rich text',
    'Rich text': 'Rich text',
    'Rich text content': 'Rich text content',
    // edit-app/src/block-types/section.js
    'Section': 'Section',
    'Background': 'Background',
    // edit-app/src/BlockWidget/ImagePicker.jsx
    'Choose a picture': 'Choose a picture',
    //edit-app/src/Upload/UploadButton.jsx
    'File name': 'File name',
    'Upload picture': 'Upload picture',
    'File extension not supported': 'File extension not supported',
    'File size must not exceed %dMB': 'File size must not exceed %dMB',
    'Failed to upload image': 'Failed to upload image',
    //edit-app/src/Upload/UploadsManager.jsx
    'Documents': 'Documents',
    'Images': 'Images',
    'Upload': 'Upload',
    'Search': 'Search',
    'No results for "%s"': 'No results for "%s"',
    'No uploads yet': 'No uploads yet',
}, validationStrings);
