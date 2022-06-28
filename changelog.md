# Changelog

...

# 0.11.0 (not yet released)

## Added
- `$annotations parameter to PluginAPI->registerHttpRoute()` (Plugin developer can define ACL-rules for routes)
- Support for many-to-many properties

## Fixed
- .

## Changed
- Image block type's default output (`<span><img>` -> `<figure><img>`)

# 0.10.0 (2022-05-12)

## Added
- An ability to drag blocks between block tree's branches
- `filterLimit`, and `filterAdditional.'p.url'.$startsWith` to listing blocks
- `WebPageAwareTemplate->head()`, which renders most common SEO-tags by default

## Fixed
- An issue, where the page blew up in edit mode, if some of the blocks contained specific type of css

## Changed
- The event type (onChange -> onInput) that refreshes styles preview in edit mode
- The UI of listing blocks

# 0.9.0 (2022-04-08)

## Added
- An ability to change theme's global variable values in edit app
- An ability to apply base CSS for block types in edit app
- An ability to apply CSS for individual blocks in edit app
- &lt;selectPageType&gt; -dropdown to Listing blocks
- Resizable floating dialogs (Draggabilly -> jsPanel)

## Fixed
- Bugs

## Changed
- .

# 0.8.0 (2022-02-22)

## Added
- An ability to create new page types (from the edit app's main menu)
- tagType -property to Button blocks (`link` -> `<a href ...>`, `button` -> `<button type="button" ...>`, `submit` -> `<button type="submit" ...>`)
- `UserSite|PluginApi->getPlugin(string $name)` so plugins can publish their own APIs.
- "Exit from edit mode" and "Return to edit mode" feature
- intro.js introduction for the edit app
- An ability to automatically add pages to a menu (when creating them)
- An ability to choose sqlite or mysql when installing

## Fixed
- Bugs

## Changed
- Menu blocks' links can be deleted
- The save button's position from static to sticky

# 0.7.0 (2021-01-14)

## Added
- Initial support for undoing stuff
- Columns block type
- Authentication

## Fixed
- Bugs

## Changed
- The icon library ([Feather](https://feathericons.com/) > [Tabler](https://tablericons.com/))
- Blocks now have a color that indicates where their data is stored

# 0.6.0 (2021-12-01)

## Added
- An ability to globally store blocks / block trees, and use them on multiple pages
- Image block type
- Initial support for plugins

## Fixed
- Bugs

## Changed
- The image picker can now be used to upload images

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
