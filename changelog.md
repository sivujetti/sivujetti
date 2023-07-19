# Changelog

...

# 0.15.0 (not yet released)

## Added
- .

## Changed
- .

## Fixed
- .

# 0.14.0 (2023-05-26)

_Translated by ChatGPT._

## Added
- Added the ability to define default styles for each content type.
    - These styles automatically apply when adding content of those types to a page, without the need to enable them separately.
- Added the ability to define headings, paragraphs, etc. in text contents as anchors (<p id="anchor">) in the WYSIWYG editor.
- Added the ability to define links to "Jump to section" (anchor) in the page selection widget (text contents, menus, and button links).
    - Supports external links (https://www.example.com#anchor) or internal links (/page#anchor).
- Added the ability to define "selection" type widgets in CSS code (e.g., text alignment -> left justify right).
- Added the option to "Disallow site indexing by search engines" in the editable site basic information.

# Changed
- Alt text can now be defined for images in the edit mode.
- Large radio buttons now visually match regular buttons.
- The WYSIWYG editor's toolbar is now always visible (position: static -> sticky).
- [JetForms plugin] Radio fields can now be added to pages.
- [JetForms plugin] Changed the "SMTP > Password" field to a password type.
    - The password can be revealed if desired by clicking on the eye icon.
- [JetForms plugin] Fixed an issue where form submission didn't work if the form was within unique reusable content.
- [JetForms plugin] Fixed an issue where number-type contents were not processed during form submission.
- [JetForms plugin] Moved the "Thank you for your message" element's position (from above the &lt;form&gt; element to inside the &lt;form&gt; element).
- [JetForms plugin] Added the ability to define default height for text fields (rows attribute).

# Fixed
- Fixed an issue with file uploads where confusion arose when two files with the same name were uploaded.
    - The uploaded file's name is automatically changed to file-1.jpg, etc., if file.jpg already exists.
- Fixed an issue where the WYSIWYG editor added empty paragraphs after certain elements (e.g., h5, h6).
- Several other 🐛s

# 0.13.0 (2023-03-15)

_Translated by ChatGPT._

## Added
- Edit mode now displays a confirmation dialog when navigating away from a page with unsaved changes.
- Added a separate "Files" view to the edit mode (Site > Files).
- Added the ability to upload file types other than images.
    - The functionality uses the same "algorithm" as WordPress, so all the same file types are supported (plus some common font file types: woff, ttf, otf).
- Added the ability to upload multiple files at once.
- Added the ability to upload files by dragging and dropping.
- New pages can now be automatically added to menus, in addition to the "Add Link" button, using the "Create and Add Page" button.

## Changed
- Header, Paragraph, and Rich Text contents are now consolidated as Text contents.
- Page selector widget is now used for menu content links, similar to text content links (manual typing of addresses is no longer required).
- Global styles of the site can now be edited while creating a page.
- Outermost regular contents of the content tree are now displayed as not collapsed by default (collapsed = false).
- Backend no longer renders unnecessary HTML comments for non-logged-in users.

## Fixed
- Contents can now be dragged between unique and non-unique contents.
- Eliminated notices related to PHP 8.2.
- Several other 🐛s

# 0.12.0 (2022-12-21)

_Translated by ChatGPT._

## Added
- Added visual, widget-based style editing, which allows changing styles without coding.
    - Currently, the feature supports colors and numbers (e.g., font sizes).
- Content can now be saved for reuse.
    - Saved content can be marked as unique (e.g., Footer) or duplicable (so that a new copy is created every time it's added to pages).
- Basic site information can now be edited from the edit mode menu (Settings > Edit Basic Info).
- Site pages can now be browsed from the edit mode menu (Site > Pages).
- Existing pages can now be duplicated (Site > Pages > ... menu > Duplicate or "This Page" > ... menu > Duplicate This Page).
- A page can now be tagged with a category when creating or editing the page (Content Tree > Metadata > Category > Create Category).
- List content can now be set to list only pages from a specific category.
- [JetIcons plugin] Initial version added, allowing the addition of icons from a library of around 3000 icons to pages.

## Changed
- When editing site colors, the page preview now updates while dragging the mouse, not only after the dragging ends.
- Button links no longer need to be manually typed; editing happens in a separate popup (similar to text content links).
- External links in text content can now include non-http/https links (e.g., tel:123, mailto:address, steam://game).
- The !important declaration is no longer required as frequently in CSS code for content styles, thanks to CSS layers.
- The save button now stays in the correct position.
- [JetForms plugin] Simplified editing view for contact form content.
- [JetForms plugin] Simplified message templates for contact forms.

## Fixed
- Content tree dragging functions now work more reliably.
- Content can now be duplicated within unique reusable content trees.
- The context menu no longer extends beyond the browser window.

# 0.11.0 (2022-08-15)

## Added
- A better way to add content
- Code/embed block type
- An undo button
- `$annotations` parameter to `PluginAPI->registerHttpRoute()` (Plugin developer can define ACL-rules for routes)
- Support for many-to-many properties

## Changed
- Replaced "Own Styles" and "Base styles" with "Styles"
- Image block type's default output (`<span><img>` -> `<figure><img>`)
- Button block type's default output (`<p><button|a>` -> `<button|a>`)
- Started a noStateManager -> redux -> storeon -transition
- Disabled `cli.php install-from-dir` temporarily

## Fixed
- 🐛s

# 0.10.0 (2022-05-12)

## Added
- An ability to drag blocks between block tree's branches
- `filterLimit`, and `filterAdditional.'p.url'.$startsWith` to listing blocks
- `WebPageAwareTemplate->head()`, which renders most common SEO-tags by default

## Changed
- The event type (onChange -> onInput) that refreshes styles preview in edit mode
- The UI of listing blocks

## Fixed
- An issue, where the page blew up in edit mode, if some of the blocks contained specific type of css

# 0.9.0 (2022-04-08)

## Added
- An ability to change theme's global variable values in edit app
- An ability to apply base CSS for block types in edit app
- An ability to apply CSS for individual blocks in edit app
- &lt;selectPageType&gt; -dropdown to Listing blocks
- Resizable floating dialogs (Draggabilly -> jsPanel)

## Changed
- .

## Fixed
- 🐛s

# 0.8.0 (2022-02-22)

## Added
- An ability to create new page types (from the edit app's main menu)
- tagType -property to Button blocks (`link` -> `<a href ...>`, `button` -> `<button type="button" ...>`, `submit` -> `<button type="submit" ...>`)
- `UserSite|PluginApi->getPlugin(string $name)` so plugins can publish their own APIs.
- "Exit from edit mode" and "Return to edit mode" feature
- intro.js introduction for the edit app
- An ability to automatically add pages to a menu (when creating them)
- An ability to choose sqlite or mysql when installing

## Changed
- Menu blocks' links can be deleted
- The save button's position from static to sticky

## Fixed
- 🐛s

# 0.7.0 (2021-01-14)

## Added
- Initial support for undoing stuff
- Columns block type
- Authentication

## Changed
- The icon library ([Feather](https://feathericons.com/) > [Tabler](https://tablericons.com/))
- Blocks now have a color that indicates where their data is stored

## Fixed
- 🐛s

# 0.6.0 (2021-12-01)

## Added
- An ability to globally store blocks / block trees, and use them on multiple pages
- Image block type
- Initial support for plugins

## Changed
- The image picker can now be used to upload images

## Fixed
- 🐛s

# 0.5.0 (2021-10-01)

- The edit app now shows all blocks (page's and layout's) in a single tree instead of two separate ones
- The edit app now highlights block's outline when hovered (instead of showing a small icon on top of it)
- Page meta fields are now editable
- The Save button is now able to run multiple queued operations at once when clicked

# 0.4.0 (2021-09-17)

This sprint focused on improving the overall content editing experience further, and figuring out how to implement custom page types.

- Listing and Section blocks can now be inserted to a page
- Page titles and slugs are now editable
- It's now much faster to write content by cloning previously created blocks!
- Menu blocks' links are now editable
- Sections blocks' backgrounds can now be selected from a image picker dialog
- The main "Add block" button now ignores the active block, and always adds new blocks to the root branch

# 0.3.0 (2021-08-27)

This sprint focused on adding new basic block types, and improving the overall content editing experience.

- The save button now disables itself automatically if there's invalid data on any active form
- The paragraph blocks now spawns new paragraph blocks when `Enter` is pressed (instead of adding <br>s to its own text)
- Layout blocks can now be saved
- The inspector panel now closes automatically if the block that was currently open was removed
- Heading, Button, Menu, and RichText blocks can now be inserted to a page
- Inspector panel's height and the main editor panel's width can now be adjusted
- Blocks can now be reordered by dragging with a mouse
    - Dragging between branches is not supported yet
- Block tree branches can now be collapsed / uncollapsed
- The frontend does less unnecessary work, when text is being typed to a Paragraph / Heading etc. block's input
