# Changelog

...

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
