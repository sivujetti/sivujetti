import columnsBlockType from './columns.js';
import headingBlockType from './heading.js';
import paragraphBlockType from './paragraph.js';
import sectionBlockType from './section.js';

const blockTypes = new Map;
blockTypes.set('Columns', columnsBlockType);
blockTypes.set('Heading', headingBlockType);
blockTypes.set('Paragraph', paragraphBlockType);
blockTypes.set('Section', sectionBlockType);

export default blockTypes;
