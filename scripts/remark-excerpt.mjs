// Keep the blog index's short text previews without a query layer.
export default function excerpt() {
  return (tree, file) => {
    const plain = node => node.type === 'text' || node.type === 'inlineCode'
      ? node.value : node.type === 'html' ? node.value.replace(/<[^>]*>/g, '') : node.type === 'footnoteReference' ? ' ' : (node.children || []).map(plain).join('');
    const text = tree.children.filter(node => node.type === 'paragraph').map(plain).join(' ').replace(/\s+/g, ' ').trim();
    file.data.astro.frontmatter.excerpt = text.length > 140 ? text.slice(0, 140).replace(/\s+\S*$/, '') + '…' : text;
  };
}
