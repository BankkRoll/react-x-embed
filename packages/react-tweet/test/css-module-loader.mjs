/**
 * Node loader hook that resolves `*.module.css` imports to a stub.
 *
 * The components import CSS modules, which Node can't parse. Bundlers replace
 * these with a class-name map; for server-render tests only the import needs to
 * succeed, so a Proxy returns the key as its own class name.
 */
export async function resolve(specifier, context, nextResolve) {
  // A CSS import never resolves through Node's algorithm on Windows, where the
  // parent URL can be a bare drive path. Short-circuit before that happens.
  if (specifier.endsWith('.css')) {
    return { url: new URL(specifier, context.parentURL ?? 'file:///').href, shortCircuit: true }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default new Proxy({}, { get: (_, key) => String(key) })`,
    }
  }
  return nextLoad(url, context)
}
