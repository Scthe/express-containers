function getPathFromURLWin32(url) {
  const hostname = url.hostname;
  let pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === '%') {
      const third = StringPrototypeCodePointAt(pathname, n + 2) | 0x20;
      if (
        (pathname[n + 1] === '2' && third === 102) || // 2f 2F /
        (pathname[n + 1] === '5' && third === 99)
      ) {
        // 5c 5C \
        throw new ERR_INVALID_FILE_URL_PATH(
          'must not include encoded \\ or / characters'
        );
      }
    }
  }
  pathname = SideEffectFreeRegExpPrototypeSymbolReplace(
    FORWARD_SLASH,
    pathname,
    '\\'
  );
  pathname = decodeURIComponent(pathname);
  if (hostname !== '') {
    // If hostname is set, then we have a UNC path
    // Pass the hostname through domainToUnicode just in case
    // it is an IDN using punycode encoding. We do not need to worry
    // about percent encoding because the URL parser will have
    // already taken care of that for us. Note that this only
    // causes IDNs with an appropriate `xn--` prefix to be decoded.
    return `\\\\${domainToUnicode(hostname)}${pathname}`;
  }
  // Otherwise, it's a local path that requires a drive letter
  const letter = StringPrototypeCodePointAt(pathname, 1) | 0x20;
  const sep = StringPrototypeCharAt(pathname, 2);
  if (
    letter < CHAR_LOWERCASE_A ||
    letter > CHAR_LOWERCASE_Z || // a..z A..Z
    sep !== ':'
  ) {
    throw new ERR_INVALID_FILE_URL_PATH('must be absolute');
  }
  return StringPrototypeSlice(pathname, 1);
}

function getPathFromURLPosix(url) {
  if (url.hostname !== '') {
    throw new ERR_INVALID_FILE_URL_HOST(platform);
  }
  const pathname = url.pathname;
  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === '%') {
      const third = StringPrototypeCodePointAt(pathname, n + 2) | 0x20;
      if (pathname[n + 1] === '2' && third === 102) {
        throw new ERR_INVALID_FILE_URL_PATH(
          'must not include encoded / characters'
        );
      }
    }
  }
  return decodeURIComponent(pathname);
}

export function fileURLToPath(path, options = kEmptyObject) {
  const windows = options?.windows;
  if (typeof path === 'string') path = new URL(path);
  else if (!isURL(path))
    throw new ERR_INVALID_ARG_TYPE('path', ['string', 'URL'], path);
  if (path.protocol !== 'file:') throw new ERR_INVALID_URL_SCHEME('file');
  return windows ?? isWindows
    ? getPathFromURLWin32(path)
    : getPathFromURLPosix(path);
}
