import { Language } from '../prisma/generated';

// If the language is not inside, it means it's not supported
export const PRISMA_LANGUAGE_TO_JUDGE0_NAME_PREFIX = {
  [Language.C_PLUS_PLUS]: 'C++ (GCC',
  [Language.JAVA]: 'Java (',
  [Language.PYTHON]: 'Python (2',
  [Language.PYTHON_THREE]: 'Python (3',
  [Language.C]: 'C (GCC',
  [Language.C_SHARP]: 'C#',
  [Language.JAVASCRIPT]: 'JavaScript',
  [Language.RUBY]: 'Ruby',
  [Language.SWIFT]: 'Swift',
  [Language.GO]: 'Go',
  [Language.SCALA]: 'Scala',
  [Language.KOTLIN]: 'Kotlin',
  [Language.RUST]: 'Rust',
  [Language.PHP]: 'PHP',
  [Language.TYPESCRIPT]: 'TypeScript',
  // RACKET is not supported
  [Language.ERLANG]: 'Erlang',
  [Language.ELIXIR]: 'Elixir',
  [Language.DART]: 'Dart',
  // MY_SQL is not supported
  // MS_SQL_SERVER is not supported
  // ORACLE is not supported
  [Language.BASH]: 'Bash',
  [Language.COBOL]: 'COBOL',
  [Language.LISP]: 'Common Lisp',
  [Language.F_SHARP]: 'F#',
  [Language.FORTRAN]: 'Fortran',
  // GERBIL is not supported
  [Language.HASKELL]: 'Haskell',
  // JULIA is not supported
  [Language.OBJECTIVE_C]: 'Objective-C',
  [Language.OCAML]: 'OCaml',
  [Language.PASCAL]: 'Pascal',
  [Language.PROLOG]: 'Prolog',
};

export const VERSION_NUMBER_REGEX = /\d+(\.\d+)+/;
export const VERSION_UPDATE_INTERVAL_MS = 3600000;
