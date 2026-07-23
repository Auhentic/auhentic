export function slugify(text) {
    return (text || '')
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Builds the pretty permalink for a product: /products/<id>-<name-slug>
export function productHref(product) {
    return `/products/${product.slug || product._id}`;
}