export default {
'Menu': {
    outermostEl: 'nav',
    first:
`color: #333;`,
    second:
`> div {
  > ul {
    list-style: none;
  }
}`,
},

'Button': {
    outermostEl: 'button|a',
    first:
`border: transparent;`,
    second:
`> .j-Image {
  display: inline;
  img {
    max-width: 40px;
  }
}`,
},

'Code': {
    outermostEl: 'div',
    first:
`height: 100%;`,
    second:
`> iframe {
  width: 100%;
  border: none;
}`,
    outermostElIsWrapper: true,
},

'Columns': {
    outermostEl: 'div',
    first:
`grid-template-columns: 100px 1fr;`,
    second:
`> *:first-child {
  background-color: #f1f1f1;
}
> *:last-child {
  justify-self: end;
}`,
    outermostElIsWrapper: true,
},

'GlobalBlockReference':
``,

'Heading': {
    outermostEl: 'h1|h2...',
    first:
`color: blueviolet;`,
    second:
`> strong {
  font-weight: 800;
}`,
},

'Image': {
    outermostEl: 'figure',
    first:
`display: inline;
margin: 0;`,
    second:
`> img {
  border: 2px solid #333;
}`,
},

'Listing': {
    outermostEl: 'div',
    first:
`background: #f1f1f1;`,
    second:
`> article {
  margin-bottom: 1rem
}`,
    outermostElIsWrapper: true,
},

'PageInfo':
``,

'Paragraph': {
    outermostEl: 'p',
    first:
`font: 400 1rem/1.4rem "Helvetica Neue", Arial, sans-serif;`,
    second:
`> strong {
  font-weight: 800;
}`,
},

'RichText': {
    outermostEl: 'div',
    first:
`display: inherit;`,
    second:
`> p {
  line-height: 0
}
.ql-indent-1 {
  margin: .8rem 0 .8rem .8rem;
  list-style-type: circle;
}`,
    outermostElIsWrapper: true,
},

'Section': {
    outermostEl: 'div',
    first:
`background-color: #f1f1f1;`,
    second:
`> div {
  padding: 1rem;
  .j-Heading {
    font-size: 2rem;
  }
  .j-Paragraph {
    font-size: 1.6rem
  }
}`,
    outermostElIsWrapper: true,
},

'Text': {
    outermostEl: 'div',
    first:
`display: inherit;`,
    second:
`> p {
  line-height: 0
}
.ql-indent-1 {
  margin: .8rem 0 .8rem .8rem;
  list-style-type: circle;
}`,
    outermostElIsWrapper: true,
},
};
