/* eslint-disable import/prefer-default-export */

import { basename, dirname, extname, relative } from 'pathe';

import createFilter from '../../pluginutils/createFilter';
import makeLegalIdentifier from '../../pluginutils/makeLegalIdentifier';

export function deconflict(scopes, globals, identifier) {
  let i = 1;
  let deconflicted = makeLegalIdentifier(identifier);
  const hasConflicts = () =>
    scopes.some((scope) => scope.contains(deconflicted)) ||
    globals.has(deconflicted);

  while (hasConflicts()) {
    deconflicted = makeLegalIdentifier(`${identifier}_${i}`);
    i += 1;
  }

  for (const scope of scopes) {
    scope.declarations[deconflicted] = true;
  }

  return deconflicted;
}

export function getName(id) {
  const name = makeLegalIdentifier(basename(id, extname(id)));
  if (name !== 'index') {
    return name;
  }
  return makeLegalIdentifier(basename(dirname(id)));
}

export function normalizePathSlashes(path) {
  return path.replace(/\\/g, '/');
}

export const getVirtualPathForDynamicRequirePath = (path, commonDir) =>
  `/${normalizePathSlashes(relative(commonDir, path))}`;

export function capitalize(name) {
  return name[0].toUpperCase() + name.slice(1);
}

export function getStrictRequiresFilter({ strictRequires }) {
  switch (strictRequires) {
    // eslint-disable-next-line no-undefined
    case undefined:
    case true:
      return {
        strictRequiresFilter: () => true,
        detectCyclesAndConditional: false,
      };
    case 'auto':
    case 'debug':
    case null:
      return {
        strictRequiresFilter: () => false,
        detectCyclesAndConditional: true,
      };
    case false:
      return {
        strictRequiresFilter: () => false,
        detectCyclesAndConditional: false,
      };
    default:
      if (typeof strictRequires === 'string' || Array.isArray(strictRequires)) {
        return {
          strictRequiresFilter: createFilter(strictRequires),
          detectCyclesAndConditional: false,
        };
      }
      throw new Error('Unexpected value for "strictRequires" option.');
  }
}
