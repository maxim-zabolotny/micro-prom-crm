export function getRawPathname(pathname) {
  return pathname.slice(0, pathname.lastIndexOf("/") + 1);
}
